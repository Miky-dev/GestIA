"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Ensures the session exists, belongs to an active user,
 * and the user has the ADMIN role.
 * Returns the session if valid.
 */
async function requireAdminSession() {
    const session = await auth();
    if (!session || !session.user || !session.user.companyId) {
        throw new Error("Unauthorized: You must be logged in.");
    }

    // Controlliamo il ruolo sul DB per sicurezza stringente
    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
        throw new Error("Forbidden: This action requires ADMIN privileges.");
    }

    return session;
}

/**
 * Cerca il template or lo crea partendo dal fallbacj se non esiste.
 */
export async function getReminderTemplate() {
    const session = await requireAdminSession();

    let template = await prisma.messageTemplate.findUnique({
        where: {
            companyId_name: {
                companyId: session.user.companyId,
                name: "REMINDER_24H"
            }
        }
    });

    if (!template) {
        template = await prisma.messageTemplate.create({
            data: {
                companyId: session.user.companyId,
                name: "REMINDER_24H",
                content: "Ciao {{nome}}, ti ricordiamo il tuo appuntamento per {{servizio}} il {{data}} alle {{ora}}.",
                isActive: true
            }
        });
    }

    return template;
}

/**
 * Aggiorna il contenuto testuale di quel template.
 */
export async function updateReminderTemplate(content: string) {
    const session = await requireAdminSession();

    if (!content || content.trim().length === 0) {
        throw new Error("Il contenuto del template non può essere vuoto");
    }

    const updated = await prisma.messageTemplate.upsert({
        where: {
            companyId_name: {
                companyId: session.user.companyId,
                name: "REMINDER_24H"
            }
        },
        update: {
            content: content.trim()
        },
        create: {
            companyId: session.user.companyId,
            name: "REMINDER_24H",
            content: content.trim(),
            isActive: true
        }
    });

    revalidatePath("/dashboard/settings/automations");
    return updated;
}
