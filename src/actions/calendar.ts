'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createAppointmentSchema, updateAppointmentSchema } from '@/lib/schemas';

/**
 * Recupera gli appuntamenti di un cliente specifico.
 * Strict Multi-tenant: Filtra sempre per companyId.
 */
export async function getAppointmentsByCustomerId(customerId: string) {
    const session = await auth();

    if (!session?.user?.companyId) {
        throw new Error('Non autorizzato: Sessione o Company ID mancante');
    }

    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                companyId: session.user.companyId,
                customerId: customerId,
            },
            include: {
                customer: true,
            },
            orderBy: {
                startTime: 'desc', // Dal più recente
            },
        });

        return { success: true, data: appointments };
    } catch (error) {
        console.error('Errore nel recupero appuntamenti cliente:', error);
        return { success: false, error: 'Impossibile recuperare gli appuntamenti del cliente' };
    }
}

/**
 * Recupera gli appuntamenti in un determinato range di date.
 * Strict Multi-tenant: Filtra sempre per companyId.
 */
export async function getAppointments(startDate: Date, endDate: Date) {
    const session = await auth();

    if (!session?.user?.companyId) {
        throw new Error('Non autorizzato: Sessione o Company ID mancante');
    }

    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                companyId: session.user.companyId,
                startTime: {
                    gte: startDate,
                },
                endTime: {
                    lte: endDate,
                },
            },
            include: {
                customer: true,
            },
            orderBy: {
                startTime: 'asc',
            },
        });

        return { success: true, data: appointments };
    } catch (error) {
        console.error('Errore nel recupero appuntamenti:', error);
        return { success: false, error: 'Impossibile recuperare gli appuntamenti' };
    }
}

/**
 * Crea un nuovo appuntamento.
 * Strict Multi-tenant: Associa sempre il companyId della sessione.
 */
export async function createAppointment(data: any) {
    const session = await auth();

    if (!session?.user?.companyId) {
        throw new Error('Non autorizzato');
    }

    const parsed = createAppointmentSchema.safeParse(data);

    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    const { customerId, startTime, endTime, serviceType, price, userId, status } = parsed.data;

    try {
        // Verifica esistenza cliente e appartenenza alla company
        const customer = await prisma.customer.findFirst({
            where: {
                id: customerId,
                companyId: session.user.companyId
            }
        });

        if (!customer) {
            return { success: false, error: 'Cliente non trovato' };
        }

        const newAppointment = await prisma.appointment.create({
            data: {
                companyId: session.user.companyId,
                customerId,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                serviceType,
                price: price ? Number(price) : null,
                userId: userId || null,
                status: status || 'SCHEDULED',
            },
            include: {
                customer: true // Includi customer per avere i dati completi
            }
        });

        revalidatePath('/dashboard/calendar');

        // Converti per evitare errore serializzazione Decimal
        return {
            success: true,
            data: {
                ...newAppointment,
                price: newAppointment.price ? Number(newAppointment.price) : null
            }
        };
    } catch (error) {
        console.error('Errore creazione appuntamento:', error);
        return { success: false, error: 'Errore durante la creazione dell\'appuntamento' };
    }
}

/**
 * Aggiorna SOLO le date di un appuntamento (Drag & Drop).
 * Strict Multi-tenant: Verifica che l'appuntamento appartenga alla company.
 */
export async function updateAppointmentDates(id: string, startTime: Date, endTime: Date) {
    const session = await auth();

    if (!session?.user?.companyId) {
        throw new Error('Non autorizzato');
    }

    try {
        // 1. Verifica che l'appuntamento esista e appartenga alla company
        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                id,
                companyId: session.user.companyId,
            },
        });

        if (!existingAppointment) {
            return { success: false, error: 'Appuntamento non trovato o accesso negato' };
        }

        // 2. Esegui l'aggiornamento
        const updatedAppointment = await prisma.appointment.update({
            where: { id },
            data: {
                startTime,
                endTime,
            },
        });

        revalidatePath('/dashboard/calendar');

        // Converti per evitare errore serializzazione Decimal
        return {
            success: true,
            data: {
                ...updatedAppointment,
                price: updatedAppointment.price ? Number(updatedAppointment.price) : null
            }
        };
    } catch (error) {
        console.error('Errore aggiornamento date appuntamento:', error);
        return { success: false, error: 'Errore durante l\'aggiornamento dell\'appuntamento' };
    }
}

/**
 * Elimina un appuntamento.
 * Strict Multi-tenant: Utilizza deleteMany per garantire la cancellazione solo se appartiene alla company,
 * oppure pattern findFirst + delete.
 */
export async function deleteAppointment(id: string) {
    const session = await auth();

    if (!session?.user?.companyId) {
        throw new Error('Non autorizzato');
    }

    try {
        // Usa deleteMany per garantire che solo l'appuntamento della company corrente venga cancellato
        // Prisma deleteMany restituisce un count.
        const result = await prisma.appointment.deleteMany({
            where: {
                id,
                companyId: session.user.companyId,
            },
        });

        if (result.count === 0) {
            return { success: false, error: 'Appuntamento non trovato o accesso negato' };
        }

        revalidatePath('/dashboard/calendar');
        return { success: true };
    } catch (error) {
        console.error('Errore cancellazione appuntamento:', error);
        return { success: false, error: 'Errore durante la cancellazione' };
    }
}

/**
 * Aggiorna TUTTI i dettagli di un appuntamento.
 * Strict Multi-tenant: Verifica che l'appuntamento appartenga alla company.
 */
export async function updateAppointment(id: string, data: any) {
    const session = await auth();

    if (!session?.user?.companyId) {
        throw new Error('Non autorizzato');
    }

    const parsed = updateAppointmentSchema.safeParse(data);

    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    const { customerId, startTime, endTime, serviceType, price, status } = parsed.data;

    try {
        // 1. Verifica che l'appuntamento esista e appartenga alla company
        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                id,
                companyId: session.user.companyId,
            },
        });

        if (!existingAppointment) {
            return { success: false, error: 'Appuntamento non trovato o accesso negato' };
        }

        // 2. Verifica che il nuovo customer appartenga alla company
        const customer = await prisma.customer.findFirst({
            where: {
                id: customerId,
                companyId: session.user.companyId
            }
        });

        if (!customer) {
            return { success: false, error: 'Nuovo cliente non trovato' };
        }

        // 3. Esegui l'aggiornamento
        const updatedAppointment = await prisma.appointment.update({
            where: { id },
            data: {
                customerId,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                serviceType,
                price: price ? Number(price) : null,
                status: status || 'SCHEDULED',
            },
            include: {
                customer: true
            }
        });

        revalidatePath('/dashboard/calendar');

        // Converti per evitare errore serializzazione Decimal
        return {
            success: true,
            data: {
                ...updatedAppointment,
                price: updatedAppointment.price ? Number(updatedAppointment.price) : null
            }
        };
    } catch (error) {
        console.error('Errore aggiornamento appuntamento:', error);
        return { success: false, error: 'Errore durante l\'aggiornamento dell\'appuntamento' };
    }
}
