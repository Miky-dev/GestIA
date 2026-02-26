import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WhatsAppSettingsForm } from "@/components/settings/WhatsAppSettingsForm";

export default async function WhatsAppSettingsPage() {
    const session = await auth();

    // Requisito di Sicurezza: check session e poi pre-check DB Role = ADMIN
    if (!session?.user?.id || !session?.user?.companyId) {
        redirect("/auth/login");
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <div className="bg-red-50 text-red-600 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Accesso negato</h1>
                <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                    Solo i titolari (ADMIN) possono modificare queste impostazioni.
                </p>
            </div>
        );
    }

    // Recupera le credenziali attuali della Company
    const company = await prisma.company.findUnique({
        where: { id: session.user.companyId },
        select: {
            waPhoneNumberId: true,
            waAccessToken: true,
            waVerifyToken: true,
        },
    });

    // Costruisci l'URL del webhook dinamicamente dall'host della richiesta
    const headersList = await headers();
    const host = headersList.get("host") || "tuodominio.com";
    const protocol = headersList.get("x-forwarded-proto") || "https";
    const webhookUrl = `${protocol}://${host}/api/webhooks/whatsapp`;

    // Maschera parzialmente l'Access Token per sicurezza
    const maskedAccessToken = company?.waAccessToken
        ? ""  // Forza reinserimento per sicurezza — non esponi mai il token al client
        : "";

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Impostazioni WhatsApp</h2>
            </div>
            <p className="text-muted-foreground mb-8">
                Connetti il tuo numero WhatsApp Business per inviare e ricevere messaggi direttamente da GestIA.
                {company?.waPhoneNumberId && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        ✓ Configurato
                    </span>
                )}
            </p>

            <div className="max-w-2xl">
                <WhatsAppSettingsForm
                    initialData={{
                        waPhoneNumberId: company?.waPhoneNumberId || "",
                        waAccessToken: maskedAccessToken,
                        waVerifyToken: company?.waVerifyToken || "",
                    }}
                    webhookUrl={webhookUrl}
                />
            </div>
        </div>
    );
}
