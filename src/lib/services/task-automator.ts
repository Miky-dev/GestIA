import { TaskPriority, TaskStatus } from "@prisma/client";
import { createTask } from "@/actions/tasks";
import { addDays } from "date-fns";

export type BusinessEventType = "APPOINTMENT_NO_SHOW" | "APPOINTMENT_COMPLETED";

// Payload interface that flexibily accepts event-specific data
export interface BusinessEventPayload {
    customerId: string;
    appointmentId?: string;
    [key: string]: any;
}

/**
 * Handle domain-specific business events and create automated tasks based on predefined rules.
 * 
 * @param companyId  The ID of the company
 * @param eventType  The type of business event that occurred
 * @param payload    The event data containing customerId and other relevant context
 */
export async function handleBusinessEvent(
    companyId: string,
    eventType: BusinessEventType,
    payload: BusinessEventPayload
) {
    switch (eventType) {
        case "APPOINTMENT_NO_SHOW":
            // Regola 1 (No-Show): Crea un Task per richiamare il cliente il giorno dopo.
            await createTask({
                title: "Richiamare per appuntamento mancato",
                customerId: payload.customerId,
                appointmentId: payload.appointmentId,
                priority: TaskPriority.HIGH,
                dueDate: addDays(new Date(), 1), // Scadenza: Domani
                status: TaskStatus.TODO,
            });
            break;

        case "APPOINTMENT_COMPLETED":
            // Regola 2 (Follow-up): Crea un Task per feedback post-trattamento tra 3 giorni.
            await createTask({
                title: "Feedback post-trattamento",
                customerId: payload.customerId,
                appointmentId: payload.appointmentId,
                priority: TaskPriority.MEDIUM,
                dueDate: addDays(new Date(), 3), // Scadenza: Tra 3 giorni
                status: TaskStatus.TODO,
            });
            break;

        default:
            console.warn(`Unrecognized business event type: ${eventType}`);
            break;
    }
}
