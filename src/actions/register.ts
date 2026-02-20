'use server';

import { z } from 'zod';
import { hash } from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { signIn } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';

// ==========================================
// SCHEMA DI VALIDAZIONE
// ==========================================

const registerSchema = z.object({
    companyName: z.string().min(2, 'Il nome azienda deve avere almeno 2 caratteri'),
    adminName: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
    email: z.string().email("Inserisci un'email valida"),
    password: z.string().min(8, 'La password deve avere almeno 8 caratteri'),
    // Campi facoltativi — salvati sulla Company
    vatNumber: z.string().optional(),
    phoneNumber: z.string().optional(),
    industry: z.string().optional(),
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
 * - Genera token di verifica email (sha256, scadenza 24h)
 * - Invia email con link di verifica tramite Resend
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

    const { companyName, adminName, password, vatNumber, phoneNumber, industry } = parsed.data;
    const email = parsed.data.email.toLowerCase().trim();

    // 2. Genera token di verifica email (PRIMA della transazione — nessun side-effect nel tx)
    //    rawToken → nell'URL (link email)
    //    hashedToken → nel DB (sicurezza: se il DB viene compromesso, i token sono inutili)
    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h

    try {
        // 3. Transazione atomica: verifica email + crea Company + crea User con token
        await prisma.$transaction(async (tx) => {

            // 3a. Verifica che l'email non sia già in uso
            const existingUser = await tx.user.findUnique({
                where: { email },
                select: { id: true },
            });

            if (existingUser) {
                throw new Error('EMAIL_TAKEN');
            }

            // 3b. Crea la nuova Company
            const company = await tx.company.create({
                data: {
                    name: companyName,
                    subscriptionPlan: 'STARTER',
                    subscriptionStatus: 'TRIAL',
                    vatNumber: vatNumber || null,
                    phoneNumber: phoneNumber || null,
                    industry: industry || null,
                },
            });

            // 3c. Hash password con bcryptjs (salt 10)
            const passwordHash = await hash(password, 10);

            // 3d. Crea il primo utente ADMIN con token di verifica email
            await tx.user.create({
                data: {
                    companyId: company.id,
                    name: adminName,
                    email,
                    passwordHash,
                    role: 'ADMIN',
                    isActive: true,
                    // Verifica email
                    emailVerified: false,
                    emailVerifyToken: hashedToken,   // Hashato nel DB
                    emailVerifyExpires: tokenExpires,
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

    // 4. Invia email di verifica (fuori dalla tx — side-effect esterno)
    //    Non blocca il flusso in caso di errore: l'utente può richiedere una nuova email
    try {
        await sendVerificationEmail(email, rawToken);
    } catch {
        // L'utente è stato creato correttamente — solo l'email non è partita
        // Logghiamo ma non blocchiamo il login
        console.error('[registerCompany] Errore invio email di verifica:', email);
    }

    // 5. Login automatico con NextAuth (server-side signIn)
    try {
        await signIn('credentials', {
            email,
            password,
            redirect: false,
        });
    } catch {
        redirect('/login?registered=1');
    }

    // 6. Redirect al dashboard
    redirect('/dashboard');
}
