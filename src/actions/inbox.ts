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
                take: 1
            },
            _count: {
                select: {
                    messages: {
                        where: {
                            direction: "INBOUND",
                            status: "DELIVERED",
                        },
                    },
                },
            },
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
 * Per i messaggi OUTBOUND, chiama la Graph API di Meta prima di salvare nel DB.
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

    // 1. Verifica che la conversazione esista e appartenga alla company (includi il customer per il numero)
    const conversation = await prisma.conversation.findFirst({
        where: {
            id: parsed.data.conversationId,
            companyId: session.user.companyId,
        },
        include: {
            customer: true,
        },
    });

    if (!conversation) {
        throw new Error("Conversation not found");
    }

    const isSimulated = parsed.data.simulateInbound;
    let externalId: string | undefined;

    // 2. Se è un messaggio OUTBOUND reale, invia tramite la Graph API di Meta
    if (!isSimulated) {
        // Recupera le credenziali WhatsApp della Company
        const company = await prisma.company.findUnique({
            where: { id: session.user.companyId },
            select: { waPhoneNumberId: true, waAccessToken: true },
        });

        if (!company?.waPhoneNumberId || !company?.waAccessToken) {
            throw new Error(
                "WhatsApp non configurato. Vai nelle Impostazioni e inserisci le credenziali Meta."
            );
        }

        // Formatta il numero del destinatario (Meta vuole il numero SENZA il '+')
        const recipientPhone = conversation.customer.phoneE164.replace(/^\+/, "");

        // Chiama la Graph API di Meta
        const metaResponse = await fetch(
            `https://graph.facebook.com/v18.0/${company.waPhoneNumberId}/messages`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${company.waAccessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: recipientPhone,
                    type: "text",
                    text: {
                        body: parsed.data.content,
                    },
                }),
            }
        );

        const metaResult = await metaResponse.json();

        if (!metaResponse.ok) {
            // Errore dalla Graph API (es. finestra 24h scaduta, numero non valido...)
            const errorMsg =
                metaResult?.error?.message ||
                "Errore nell'invio del messaggio WhatsApp.";
            console.error("[WhatsApp API] Errore:", metaResult);
            throw new Error(`WhatsApp: ${errorMsg}`);
        }

        // Estrai l'ID del messaggio restituito da Meta
        externalId = metaResult?.messages?.[0]?.id;
    }

    // 3. Salva il messaggio nel DB
    const direction = isSimulated ? "INBOUND" : "OUTBOUND";
    const status = isSimulated ? "DELIVERED" : "SENT";

    const newMessage = await prisma.message.create({
        data: {
            conversationId: conversation.id,
            companyId: session.user.companyId,
            customerId: conversation.customerId,
            direction,
            content: parsed.data.content,
            status,
            ...(externalId && { externalId }),
        },
    });

    // 4. Aggiorna lastMessageAt della conversazione
    await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
            lastMessageAt: new Date(),
            status: isSimulated ? "OPEN" : "PENDING",
        },
    });

    revalidatePath("/dashboard/inbox");

    return newMessage;
}

/**
 * Conta il totale dei messaggi non letti (inbound con status DELIVERED) per la company.
 */
export async function getUnreadCount() {
    const session = await auth();
    if (!session?.user?.companyId) {
        return 0;
    }

    const count = await prisma.message.count({
        where: {
            companyId: session.user.companyId,
            direction: "INBOUND",
            status: "DELIVERED",
        },
    });

    return count;
}

/**
 * Segna tutti i messaggi inbound di una conversazione come letti (READ).
 */
export async function markConversationAsRead(conversationId: string) {
    const session = await auth();
    if (!session?.user?.companyId) {
        throw new Error("Unauthorized");
    }

    await prisma.message.updateMany({
        where: {
            conversationId,
            companyId: session.user.companyId,
            direction: "INBOUND",
            status: "DELIVERED",
        },
        data: {
            status: "READ",
        },
    });
}
