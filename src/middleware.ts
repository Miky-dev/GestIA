import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotte che richiedono autenticazione
const PROTECTED_PATHS = ["/dashboard", "/inbox", "/customers", "/calendar"];

// Rotte API protette (eccetto /api/auth che gestisce il login stesso)
const PROTECTED_API_PREFIX = "/api";
const AUTH_API_PREFIX = "/api/auth";

export async function middleware(request: NextRequest): Promise<NextResponse> {
    const { pathname } = request.nextUrl;

    // Controlla se la rotta è protetta
    const isProtectedPage = PROTECTED_PATHS.some((path) =>
        pathname.startsWith(path)
    );
    const isProtectedApi =
        pathname.startsWith(PROTECTED_API_PREFIX) &&
        !pathname.startsWith(AUTH_API_PREFIX);

    if (!isProtectedPage && !isProtectedApi) {
        return NextResponse.next();
    }

    // Verifica la sessione
    const session = await auth();

    if (!session) {
        // Pagine: redirect a /login con ?callbackUrl per tornare dopo il login
        if (isProtectedPage) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }

        // API: restituisce 401 JSON
        return NextResponse.json(
            { error: "Non autorizzato. Effettua il login." },
            { status: 401 }
        );
    }

    return NextResponse.next();
}

export const config = {
    // Esegue il middleware solo sulle rotte rilevanti, esclude file statici
    matcher: [
        "/dashboard/:path*",
        "/inbox/:path*",
        "/customers/:path*",
        "/calendar/:path*",
        "/api/((?!auth).)*",
    ],
};
