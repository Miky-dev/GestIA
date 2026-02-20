'use server';

import { z } from 'zod';
import { hash } from 'bcryptjs';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { signIn } from '@/lib/auth';

// ==========================================
// SCHEMA DI VALIDAZIONE
// ==========================================

const registerSchema = z.object({
    companyName: z.string().min(2, 'Il nome azienda deve avere almeno 2 caratteri'),
    adminName: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
    email: z.string().email("Inserisci un'email valida"),
    password: z.string().min(8, 'La password deve avere almeno 8 caratteri'),
});

type RegisterInput = z.infer<typeof registerSchema>;

// ==========================================
// TIPI DI RISPOSTA
// ==========================================

type RegisterResult =
    | { success: true }
    | { success: false; error: string; fieldErrors?: Partial<Record<keyof RegisterInput, string>> };

// ==========================================
// SERVER ACTION: registerCompany
// ==========================================

/**
 * Registrazione pubblica: crea una nuova Company con il primo utente ADMIN.
 * 
 * - NON accetta companyId in input
 * - NON permette la scelta del ruolo (sempre ADMIN)
 * - NON crea altri utenti
 * - Tutto avviene in una transazione atomica
 * - Dopo la creazione effettua login automatico e redirect a /dashboard
 */
export async function registerCompany(rawData: RegisterInput): Promise<RegisterResult> {

    // 1. Validazione input con Zod
    const parsed = registerSchema.safeParse(rawData);

    if (!parsed.success) {
        const fieldErrors: Partial<Record<keyof RegisterInput, string>> = {};
        for (const issue of parsed.error.issues) {
            const field = issue.path[0] as keyof RegisterInput;
            if (field) fieldErrors[field] = issue.message;
        }
        return {
            success: false,
            error: 'Dati non validi. Controlla i campi e riprova.',
            fieldErrors,
        };
    }

    const { companyName, adminName, email, password } = parsed.data;

    try {
        // 2. Transazione atomica: verifica email + crea Company + crea User
        await prisma.$transaction(async (tx) => {

            // 2a. Verifica che l'email non sia già in uso
            const existingUser = await tx.user.findUnique({
                where: { email },
                select: { id: true },
            });

            if (existingUser) {
                throw new Error('EMAIL_TAKEN');
            }

            // 2b. Crea la nuova Company 
            const company = await tx.company.create({
                data: {
                    name: companyName,
                    subscriptionPlan: 'STARTER',
                    subscriptionStatus: 'TRIAL',
                },
            });

            // 2c. Hash password con bcryptjs (salt 10)
            const passwordHash = await hash(password, 10);

            // 2d. Crea il primo utente ADMIN della company
            await tx.user.create({
                data: {
                    companyId: company.id,   // Generato automaticamente
                    name: adminName,
                    email,
                    passwordHash,
                    role: 'ADMIN',          // Sempre ADMIN per il fondatore
                    isActive: true,
                },
            });
        });

    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'EMAIL_TAKEN') {
                return {
                    success: false,
                    error: "Esiste già un account con questa email.",
                    fieldErrors: { email: "Questa email è già in uso." },
                };
            }
        }
        return {
            success: false,
            error: 'Si è verificato un errore durante la registrazione. Riprova più tardi.',
        };
    }

    // 3. Login automatico con NextAuth (server-side signIn)
    //    Chiamato FUORI dalla transazione per evitare side-effect nel tx
    try {
        await signIn('credentials', {
            email,
            password,
            redirect: false,
        });
    } catch {
        // Se il login automatico fallisce, redirige al login manuale
        // senza esporre l'errore (l'utente è stato creato correttamente)
        redirect('/login?registered=1');
    }

    // 4. Redirect al dashboard
    redirect('/dashboard');
}
