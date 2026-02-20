"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { loginRateLimiter } from "@/lib/rate-limit";

export type LoginResult =
    | { success: true }
    | { success: false; error: string };

export async function loginUser(data: {
    email: string;
    password: string;
}): Promise<LoginResult> {
    const ipIdentifier = "global_login_" + data.email.toLowerCase().trim();

    try {
        await loginRateLimiter.consume(ipIdentifier);
    } catch (maxRetriesObj: unknown) {
        const retryObj = maxRetriesObj as { msBeforeNext?: number };
        const retrySecs = Math.round((retryObj.msBeforeNext || 1000) / 1000) || 1;
        return {
            success: false,
            error: `Troppi tentativi falliti. Riprova tra ${retrySecs} secondi.`
        };
    }

    try {
        await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
        });

        return { success: true };
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    // Distingue "account disattivato" da "credenziali errate"
                    if ((error as AuthError & { code?: string }).code === "account_disabled") {
                        return {
                            success: false,
                            error: "Il tuo account è stato disattivato. Contatta l'amministratore.",
                        };
                    }
                    return { success: false, error: "Email o password non validi." };
                case "CallbackRouteError":
                    return { success: false, error: "Errore durante il login. Riprova." };
                default:
                    return { success: false, error: "Si è verificato un errore imprevisto." };
            }
        }
        // Re-throw non-AuthError (es. errori di rete o redirect intenzionali)
        throw error;
    }
}
