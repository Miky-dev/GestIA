import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { User } from "next-auth";

// Errore tipizzato per account disattivato
class DisabledAccountError extends CredentialsSignin {
    code = "account_disabled";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    // Nessun adapter: gestiamo tutto manualmente in authorize()
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },

            async authorize(credentials): Promise<User | null> {
                let email = credentials?.email as string | undefined;
                const password = credentials?.password as string | undefined;

                if (!email || !password) return null;
                email = email.toLowerCase().trim();

                // Cerca l'utente nel DB tramite Prisma
                const dbUser = await prisma.user.findUnique({
                    where: { email },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        passwordHash: true,
                        role: true,
                        companyId: true,
                        isActive: true,
                        emailVerified: true,
                    },
                });

                // Utente non trovato
                if (!dbUser) return null;

                // Account disabilitato (soft delete) → errore specifico
                if (!dbUser.isActive) {
                    throw new DisabledAccountError();
                }

                // Verifica della password con bcryptjs
                const passwordsMatch = await compare(password, dbUser.passwordHash);
                if (!passwordsMatch) return null;

                // Restituisce solo i dati necessari al token JWT
                return {
                    id: dbUser.id,
                    email: dbUser.email,
                    name: dbUser.name,
                    companyId: dbUser.companyId,
                    role: dbUser.role,
                    isEmailVerified: dbUser.emailVerified,
                };
            },
        }),
    ],

    callbacks: {
        // jwt() viene chiamato quando il token viene creato o aggiornato
        async jwt({ token, user }) {
            if (user) {
                // user.id è sempre definito quando ritornato da authorize()
                token.id = user.id!;
                token.companyId = user.companyId;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                token.role = (user as any).role;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                token.isEmailVerified = (user as any).isEmailVerified ?? false;
            }
            return token;
        },

        // session() viene chiamato quando la sessione viene letta dal client
        async session({ session, token }) {
            session.user.id = token.id ?? token.sub ?? "";
            session.user.companyId = token.companyId ?? "";
            session.user.role = token.role;
            session.user.isEmailVerified = token.isEmailVerified ?? false;
            return session;
        },
    },

    pages: {
        signIn: "/login",
        error: "/login",
    },

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 giorni
    },
});
