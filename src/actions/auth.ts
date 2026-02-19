"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export type LoginResult =
    | { success: true }
    | { success: false; error: string };

export async function loginUser(data: {
    email: string;
    password: string;
}): Promise<LoginResult> {
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
