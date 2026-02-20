import { z } from 'zod';
import { Role } from '@prisma/client';

// ==========================================
// SCHEMI DI VALIDAZIONE ZOD - CALENDARIO
// ==========================================

const baseAppointmentSchema = z.object({
    customerId: z.string().uuid("ID cliente non valido"),
    startTime: z.coerce.date({ message: "Data di inizio obbligatoria" }),
    endTime: z.coerce.date({ message: "Data di fine obbligatoria" }),
    serviceType: z.string().min(2, "Seleziona un tipo di servizio valido"),
    price: z.coerce.number().optional().nullable(),
    userId: z.string().uuid("ID operatore non valido").optional().nullable(),
    status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional()
});

export const createAppointmentSchema = baseAppointmentSchema.refine(data => data.startTime < data.endTime, {
    message: "La data di fine deve essere successiva alla data di inizio",
    path: ["endTime"]
});

export const updateAppointmentSchema = baseAppointmentSchema.partial().extend({
    customerId: z.string().uuid("ID cliente non valido"),
    startTime: z.coerce.date({ message: "Data di inizio obbligatoria" }),
    endTime: z.coerce.date({ message: "Data di fine obbligatoria" }),
    serviceType: z.string().min(2, "Seleziona un tipo di servizio valido")
}).refine(data => data.startTime && data.endTime ? data.startTime < data.endTime : true, {
    message: "La data di fine deve essere successiva alla data di inizio",
    path: ["endTime"]
});

// ==========================================
// SCHEMI DI VALIDAZIONE ZOD - DIPENDENTI
// ==========================================

export const createEmployeeSchema = z.object({
    name: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
    email: z.string().email("Inserisci un'email valida"),
    role: z.nativeEnum(Role, { message: "Seleziona un ruolo valido" }),
    password: z.string().min(8, "La password deve avere almeno 8 caratteri")
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
    password: z.string().min(8, "La password deve avere almeno 8 caratteri").optional().or(z.literal(""))
});

export type CreateEmployeeData = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeData = z.infer<typeof updateEmployeeSchema>;

// ==========================================
// SCHEMI DI VALIDAZIONE ZOD - CLIENTI
// ==========================================

export const customerSchema = z.object({
    firstName: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
    lastName: z.string().min(2, "Il cognome deve avere almeno 2 caratteri"),
    phone: z.string().min(5, "Inserisci un numero di telefono valido"),
    email: z.string().email("Email non valida").optional().or(z.literal("")),
    internalNotes: z.string().optional(),
    birthDate: z.coerce.date().optional(),
    gender: z.string().optional(),
    fiscalCode: z.string().optional(),
    vatNumber: z.string().optional(),
});

export type CreateCustomerData = z.infer<typeof customerSchema>;
export type UpdateCustomerData = Partial<CreateCustomerData>;

// ==========================================
// SCHEMI DI VALIDAZIONE ZOD - INBOX
// ==========================================

export const sendMessageSchema = z.object({
    conversationId: z.string().uuid("ID conversazione non valido"),
    content: z.string().min(1, "Il messaggio non può essere vuoto"),
});

export type SendMessageData = z.infer<typeof sendMessageSchema>;
