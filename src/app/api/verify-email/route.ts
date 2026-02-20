import { type NextRequest, NextResponse } from 'next/server';
import { verifyEmail } from '@/actions/verify-email';

/**
 * GET /api/verify-email?token=<rawToken>
 *
 * Endpoint per la verifica dell'email tramite link.
 * Tutta la logica di validazione è delegata al server action `verifyEmail`.
 *
 * Flusso:
 *   - Token valido   → redirect a /verify-email?verified=true
 *   - Token scaduto  → redirect a /verify-email?error=expired
 *   - Token invalido → redirect a /verify-email?error=invalid
 *   - Già verificato → redirect a /verify-email?error=already
 *   - Errore server  → redirect a /verify-email?error=server
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const token = searchParams.get('token');

    const baseUrl = new URL('/(auth)/verify-email', request.nextUrl.origin);

    // Token assente o troppo corto
    if (!token || token.length < 10) {
        baseUrl.searchParams.set('error', 'invalid');
        return NextResponse.redirect(baseUrl);
    }

    const result = await verifyEmail(token);

    if (result.success) {
        baseUrl.searchParams.set('verified', 'true');
        return NextResponse.redirect(baseUrl);
    }

    // Mappa i codici errore interni a query param leggibili
    const errorMap: Record<string, string> = {
        INVALID_TOKEN: 'invalid',
        EXPIRED_TOKEN: 'expired',
        ALREADY_VERIFIED: 'already',
        SERVER_ERROR: 'server',
    };

    const errorParam = errorMap[result.error] ?? 'server';
    baseUrl.searchParams.set('error', errorParam);
    return NextResponse.redirect(baseUrl);
}
