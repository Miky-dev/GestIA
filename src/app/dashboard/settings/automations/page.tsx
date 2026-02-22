import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReminderTemplate } from "@/actions/templates";
import { TemplateFormClient } from "@/components/automations/TemplateFormClient";

export default async function AutomationsSettingsPage() {
    const session = await auth();

    // Requisito di Sicurezza: check session e poi pre-check DB Role = ADMIN 
    if (!session?.user?.id || !session?.user?.companyId) {
        redirect("/auth/login");
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
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

    // Passiamo i dati al client component
    const template = await getReminderTemplate();

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Impostazioni Automazioni</h2>
            </div>
            <p className="text-muted-foreground mb-8">
                Personalizza i messaggi automatici inviati al cliente per i promemoria WhatsApp (24h prima).
            </p>

            <div className="max-w-5xl">
                <TemplateFormClient initialContent={template.content} />
            </div>
        </div>
    );
}
