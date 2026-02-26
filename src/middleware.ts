import NextAuth from "next-auth";

/**
 * Configurazione LEGGERA solo per il Middleware (Edge Runtime).
 *
 * NON importa bcryptjs, Prisma o il provider Credentials completo,
 * così il bundle resta sotto il limite di 1 MB di Vercel.
 *
 * Controlla solo se esiste un JWT valido nel cookie di sessione.
 */
const { auth } = NextAuth({
    providers: [], // Nessun provider qui — il login è gestito dalla config completa in auth.ts
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        authorized({ auth: session, request: { nextUrl } }) {
            const isLoggedIn = !!session?.user;
            const isProtected =
                nextUrl.pathname.startsWith("/dashboard") ||
                nextUrl.pathname.startsWith("/inbox") ||
                nextUrl.pathname.startsWith("/customers") ||
                nextUrl.pathname.startsWith("/calendar") ||
                (nextUrl.pathname.startsWith("/api") &&
                    !nextUrl.pathname.startsWith("/api/auth"));

            if (isProtected && !isLoggedIn) {
                return false; // NextAuth redirecterà automaticamente a /login
            }

            return true;
        },
    },
});

export default auth;

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/inbox/:path*",
        "/customers/:path*",
        "/calendar/:path*",
        "/api/((?!auth).)*",
    ],
};
