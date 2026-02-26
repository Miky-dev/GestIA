import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ==========================================
// GET — Verifica Webhook da Meta
// ==========================================
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;

    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    // Meta invia sempre questi 3 parametri durante la verifica
    if (mode !== "subscribe" || !token || !challenge) {
        return new NextResponse("Missing parameters", { status: 400 });
    }

    // Cerca la Company che ha quel verify token
    const company = await prisma.company.findFirst({
        where: { waVerifyToken: token },
    });

    if (!company) {
        console.warn("[Webhook] Verify token non corrisponde a nessuna Company:", token);
        return new NextResponse("Forbidden", { status: 403 });
    }

    // Verifica superata — rispondi con la challenge in plain text
    console.log(`[Webhook] Verifica OK per Company "${company.name}" (${company.id})`);
    return new NextResponse(challenge, { status: 200 });
}

// ==========================================
// POST — Ricezione Messaggi da Meta
// ==========================================
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Estrai l'entry principale del payload Meta
        const entry = body?.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if (!value) {
            // Payload non standard — conferma ricezione per evitare retry
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // ===== IL CUORE DEL ROUTING MULTI-TENANT =====
        const phoneNumberId = value.metadata?.phone_number_id;

        if (!phoneNumberId) {
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // Cerca la Company proprietaria di questo numero WhatsApp
        const company = await prisma.company.findUnique({
            where: { waPhoneNumberId: phoneNumberId },
        });

        if (!company) {
            // Numero non registrato — ignora silenziosamente
            console.warn("[Webhook] phone_number_id non registrato:", phoneNumberId);
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // ===== ESTRAZIONE DATI DAL PAYLOAD =====
        const messages = value.messages;

        // Se non ci sono messaggi (es: status update), conferma e basta
        if (!messages || messages.length === 0) {
            return NextResponse.json({ success: true }, { status: 200 });
        }

        const incomingMessage = messages[0];
        const contacts = value.contacts;

        // Estrai i dati chiave
        const senderWaId = contacts?.[0]?.wa_id; // Numero del mittente
        const senderName = contacts?.[0]?.profile?.name || "Sconosciuto";
        const messageText = incomingMessage?.text?.body;
        const metaMessageId = incomingMessage?.id;

        // Solo messaggi di testo per ora
        if (!senderWaId || !messageText || !metaMessageId) {
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // Formatta il numero con il '+' se manca
        const phoneE164 = senderWaId.startsWith("+") ? senderWaId : `+${senderWaId}`;

        // ===== SALVATAGGIO IN TRANSAZIONE =====
        await prisma.$transaction(async (tx) => {
            // 1. Cerca o crea il Customer
            let customer = await tx.customer.findUnique({
                where: {
                    companyId_phoneE164: {
                        companyId: company.id,
                        phoneE164: phoneE164,
                    },
                },
            });

            if (!customer) {
                // Crea un cliente al volo con i dati disponibili
                const nameParts = senderName.split(" ");
                customer = await tx.customer.create({
                    data: {
                        companyId: company.id,
                        firstName: nameParts[0] || "Sconosciuto",
                        lastName: nameParts.slice(1).join(" ") || "",
                        phoneE164: phoneE164,
                    },
                });
                console.log(`[Webhook] Nuovo Customer creato: ${customer.id} per Company ${company.id}`);
            }

            // 2. Trova o crea la Conversation attiva
            let conversation = await tx.conversation.findFirst({
                where: {
                    companyId: company.id,
                    customerId: customer.id,
                    channel: "WHATSAPP",
                    status: { in: ["OPEN", "PENDING"] },
                },
            });

            if (!conversation) {
                conversation = await tx.conversation.create({
                    data: {
                        companyId: company.id,
                        customerId: customer.id,
                        channel: "WHATSAPP",
                        status: "OPEN",
                        lastMessageAt: new Date(),
                    },
                });
                console.log(`[Webhook] Nuova Conversation creata: ${conversation.id}`);
            }

            // 3. Crea il Message (con deduplicazione via externalId)
            const existingMessage = await tx.message.findUnique({
                where: { externalId: metaMessageId },
            });

            if (existingMessage) {
                // Messaggio già processato — skip (Meta ha inviato il webhook due volte)
                console.log(`[Webhook] Messaggio duplicato ignorato: ${metaMessageId}`);
                return;
            }

            await tx.message.create({
                data: {
                    conversationId: conversation.id,
                    companyId: company.id,
                    customerId: customer.id,
                    externalId: metaMessageId,
                    direction: "INBOUND",
                    content: messageText,
                    status: "DELIVERED",
                },
            });

            // 4. Aggiorna la data dell'ultimo messaggio nella conversation
            await tx.conversation.update({
                where: { id: conversation.id },
                data: { lastMessageAt: new Date() },
            });

            console.log(`[Webhook] Messaggio salvato per Company "${company.name}" da ${phoneE164}`);
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        // Logga l'errore ma rispondi 200 per evitare retry infiniti da Meta
        console.error("[Webhook] Errore nel processamento:", error);
        return NextResponse.json({ success: true }, { status: 200 });
    }
}
