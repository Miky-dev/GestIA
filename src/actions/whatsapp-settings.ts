"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Aggiorna le credenziali WhatsApp Cloud API per la Company dell'utente loggato.
 * Solo ADMIN può eseguire questa azione.
 */
export async function updateWhatsAppCredentials(data: {
    waPhoneNumberId: string;
    waAccessToken: string;
    waVerifyToken: string;
}) {
    const session = await auth();
    if (!session?.user?.companyId || !session?.user?.id) {
        throw new Error("Unauthorized");
    }

    // Verifica ruolo ADMIN nel DB
    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
        throw new Error("Solo gli amministratori possono modificare queste impostazioni.");
    }

    // Validazione base
    if (!data.waPhoneNumberId?.trim() || !data.waAccessToken?.trim() || !data.waVerifyToken?.trim()) {
        throw new Error("Tutti i campi sono obbligatori.");
    }

    // Aggiorna i campi sulla Company
    await prisma.company.update({
        where: { id: session.user.companyId },
        data: {
            waPhoneNumberId: data.waPhoneNumberId.trim(),
            waAccessToken: data.waAccessToken.trim(),
            waVerifyToken: data.waVerifyToken.trim(),
        },
    });

    revalidatePath("/dashboard/settings/whatsapp");

    return { success: true };
}
