"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendMessageSchema, type SendMessageData } from "@/lib/schemas";

/**
 * Recupera tutte le conversazioni della company corrente (ordinate dalla più recente).
 */
export async function getConversations() {
    const session = await auth();
    if (!session?.user?.companyId) {
        throw new Error("Unauthorized");
    }

    return await prisma.conversation.findMany({
        where: {
            companyId: session.user.companyId,
        },
        include: {
            customer: true,
            assignee: true,
            messages: {
                orderBy: {
                    createdAt: "desc"
                },
                take: 1 // Prendiamo solo l'ultimo messaggio per l'anteprima nella sidebar
            }
        },
        orderBy: {
            lastMessageAt: "desc",
        },
    });
}

/**
 * Recupera una singola conversazione e tutti i suoi messaggi in ordine cronologico.
 */
export async function getConversationWithMessages(conversationId: string) {
    const session = await auth();
    if (!session?.user?.companyId) {
        throw new Error("Unauthorized");
    }

    const conversation = await prisma.conversation.findFirst({
        where: {
            id: conversationId,
            companyId: session.user.companyId,
        },
        include: {
            customer: true,
            messages: {
                orderBy: {
                    createdAt: "asc", // Più vecchi sopra, più nuovi sotto
                },
            },
        },
    });

    return conversation;
}

/**
 * Invia un nuovo messaggio all'interno di una conversazione.
 */
export async function sendMessage(data: SendMessageData) {
    const session = await auth();
    if (!session?.user?.companyId) {
        throw new Error("Unauthorized");
    }

    const parsed = sendMessageSchema.safeParse(data);
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0].message);
    }

    // 1. Verifica che la conversazione esista e appartenga alla company
    const conversation = await prisma.conversation.findFirst({
        where: {
            id: parsed.data.conversationId,
            companyId: session.user.companyId,
        },
    });

    if (!conversation) {
        throw new Error("Conversation not found");
    }

    // 2. Crea il nuovo messaggio
    const newMessage = await prisma.message.create({
        data: {
            conversationId: conversation.id,
            companyId: session.user.companyId,
            customerId: conversation.customerId,
            direction: "OUTBOUND",
            content: parsed.data.content,
            status: "SENT",
        },
    });

    // 3. Aggiorna lastMessageAt della conversazione
    await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
            lastMessageAt: new Date(),
            status: "PENDING" // Segniamo la conversazione come In Attesa se abbiamo risposto
        },
    });

    revalidatePath("/dashboard/inbox");

    // NOTA MVP: In un sistema reale, qui si interfaccerà con l'API Meta/Twilio

    return newMessage;
}
