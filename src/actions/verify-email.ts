'use server';

import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';

/**
 * Verifica il token email ricevuto dall'utente via link.
 *
 * Sicurezza:
 * - Il token in DB è hashato (sha256) → l'originale vive solo nell'URL
 * - Controlla la scadenza (emailVerifyExpires > now)
 * - Invalida il token dopo l'utilizzo (one-time use)
 */
export async function verifyEmail(rawToken: string): Promise<
    | { success: true }
    | { success: false; error: 'INVALID_TOKEN' | 'EXPIRED_TOKEN' | 'ALREADY_VERIFIED' | 'SERVER_ERROR' }
> {
    if (!rawToken || rawToken.length < 10) {
        return { success: false, error: 'INVALID_TOKEN' };
    }

    // 1. Hash del token ricevuto per confrontarlo con il DB
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');

    try {
        // 2. Cerca utente con questo token
        const user = await prisma.user.findFirst({
            where: { emailVerifyToken: hashedToken },
            select: {
                id: true,
                emailVerified: true,
                emailVerifyExpires: true,
            },
        });

        if (!user) {
            return { success: false, error: 'INVALID_TOKEN' };
        }

        if (user.emailVerified) {
            return { success: false, error: 'ALREADY_VERIFIED' };
        }

        // 3. Verifica scadenza
        if (!user.emailVerifyExpires || user.emailVerifyExpires < new Date()) {
            return { success: false, error: 'EXPIRED_TOKEN' };
        }

        // 4. Marca come verificato e invalida il token (one-time use)
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                emailVerifyToken: null,
                emailVerifyExpires: null,
            },
        });

        return { success: true };

    } catch {
        return { success: false, error: 'SERVER_ERROR' };
    }
}

// =====================================================
// resendVerificationEmail
// =====================================================

/**
 * Re-invia l'email di verifica all'utente attualmente loggato.
 *
 * Rate-limit semplice: se esiste già un token non ancora scaduto,
 * non ne genera uno nuovo (evita spam di email).
 */
export async function resendVerificationEmail(): Promise<
    | { success: true }
    | { success: false; error: 'UNAUTHORIZED' | 'ALREADY_VERIFIED' | 'RATE_LIMITED' | 'SERVER_ERROR' }
> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'UNAUTHORIZED' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                emailVerified: true,
                emailVerifyExpires: true,
                lastVerificationEmailSentAt: true,
            },
        });

        if (!user) {
            return { success: false, error: 'UNAUTHORIZED' };
        }

        if (user.emailVerified) {
            return { success: false, error: 'ALREADY_VERIFIED' };
        }

        // Rate-limit: 2 minuti tra un invio e l'altro
        if (user.lastVerificationEmailSentAt) {
            const dueMinutiFa = new Date(Date.now() - 2 * 60 * 1000);
            if (user.lastVerificationEmailSentAt > dueMinutiFa) {
                return { success: false, error: 'RATE_LIMITED' };
            }
        }

        // Genera nuovo token
        const rawToken = randomBytes(32).toString('hex');
        const hashedToken = createHash('sha256').update(rawToken).digest('hex');
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h

        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerifyToken: hashedToken,
                emailVerifyExpires: tokenExpires,
                lastVerificationEmailSentAt: new Date(),
            },
        });

        await sendVerificationEmail(user.email, rawToken);

        return { success: true };

    } catch {
        return { success: false, error: 'SERVER_ERROR' };
    }
}
