import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { it } from "date-fns/locale";

/**
 * Simula l'invio fisico di un promemoria WhatsApp su database tramite transazione sicura.
 * Formatta il template e salva il messaggio collegato alla conversazione.
 */
export async function simulateWhatsAppReminder(appointmentId: string): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. Query iniziale (Safe Check)
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                customer: true,
                company: true,
            }
        });

        if (!appointment) {
            return { success: false, error: "Appuntamento non trovato" };
        }

        if (appointment.status !== "SCHEDULED") {
            return { success: false, error: "Appuntamento non in stato SCHEDULED" };
        }

        if (appointment.reminderSent) {
            return { success: false, error: "Promemoria già inviato" };
        }

        // 2. Gestione Template
        let templateContent = "Ciao {{nome}}, ti ricordiamo il tuo appuntamento per {{servizio}} il {{data}} alle {{ora}}.";

        const messageTemplate = await prisma.messageTemplate.findFirst({
            where: {
                companyId: appointment.companyId,
                isActive: true
            }
        });

        if (messageTemplate) {
            templateContent = messageTemplate.content;
        }

        // 3. Compilazione del Template
        const startTime = new Date(appointment.startTime);

        const formattedDate = format(startTime, "dd MMMM", { locale: it });
        const formattedTime = format(startTime, "HH:mm");

        const textToSend = templateContent
            .replace(/\{\{nome\}\}/g, appointment.customer.firstName)
            .replace(/\{\{servizio\}\}/g, appointment.serviceType)
            .replace(/\{\{data\}\}/g, formattedDate)
            .replace(/\{\{ora\}\}/g, formattedTime);

        // 4. Logica Transazionale
        await prisma.$transaction(async (tx) => {
            // Cerca o crea la Conversation
            let conversation = await tx.conversation.findFirst({
                where: {
                    companyId: appointment.companyId,
                    customerId: appointment.customerId,
                    channel: "WHATSAPP"
                }
            });

            if (!conversation) {
                conversation = await tx.conversation.create({
                    data: {
                        companyId: appointment.companyId,
                        customerId: appointment.customerId,
                        channel: "WHATSAPP",
                        status: "PENDING"
                    }
                });
            } else {
                conversation = await tx.conversation.update({
                    where: { id: conversation.id },
                    data: {
                        status: "PENDING",
                        lastMessageAt: new Date()
                    }
                });
            }

            // Crea il Message
            await tx.message.create({
                data: {
                    conversationId: conversation.id,
                    companyId: appointment.companyId,
                    customerId: appointment.customerId,
                    direction: "OUTBOUND",
                    content: textToSend,
                    status: "SENT"
                }
            });

            // Aggiorna l'Appointment
            await tx.appointment.update({
                where: { id: appointment.id },
                data: {
                    reminderSent: true
                }
            });
        });

        // 5. Console Log di Sistema
        console.log(`[WHATSAPP SIMULATOR] Inviato a ${appointment.customer.phoneE164} per appuntamento ${appointment.id}`);

        return { success: true };

    } catch (error) {
        console.error("[WHATSAPP SIMULATOR] Errore imprevisto:", error);
        return { success: false, error: "Errore interno del server" };
    }
}
