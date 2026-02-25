'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { hash } from 'bcryptjs';

import { createEmployeeSchema, updateEmployeeSchema } from '@/lib/schemas';
import type { CreateEmployeeData, UpdateEmployeeData } from '@/lib/schemas';

// ==========================================
// HELPER: Verifica sessione ADMIN
// ==========================================

/**
 * Verifica che la sessione sia valida, che l'utente abbia un companyId
 * e che il suo ruolo sia ADMIN. Lancia Error("Unauthorized") in caso contrario.
 */
async function requireAdminSession() {
    const session = await auth();

    if (!session?.user) {
        throw new Error('Unauthorized: Sessione non trovata');
    }

    if (!session.user.companyId) {
        throw new Error('Unauthorized: Company ID mancante nella sessione');
    }

    if (session.user.role !== 'ADMIN') {
        throw new Error('Unauthorized: Permessi insufficienti (richiesto ruolo ADMIN)');
    }

    return session;
}

/**
 * Verifica che l'email dell'admin sia confermata.
 * Ritorna un oggetto { verified: false, error } se non verificata.
 */
function checkVerifiedEmail(session: Awaited<ReturnType<typeof requireAdminSession>>) {
    if (!session.user.isEmailVerified) {
        return { verified: false as const, error: 'Verifica la tua email prima di gestire il team. Controlla la tua casella di posta.' };
    }
    return { verified: true as const };
}

// ==========================================
// getEmployees
// ==========================================

/**
 * Recupera tutti i dipendenti dell'azienda corrente.
 * Non espone mai passwordHash.
 * Strict Multi-tenant: filtra sempre per companyId.
 */
export async function getEmployees() {
    const session = await requireAdminSession();

    try {
        const employees = await prisma.user.findMany({
            where: {
                companyId: session.user.companyId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                specialty: true,
                createdAt: true,
                workSchedules: {
                    select: {
                        dayOfWeek: true,
                        startTime: true,
                        endTime: true,
                    },
                    orderBy: { dayOfWeek: 'asc' },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return { success: true, data: employees };
    } catch (error) {
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Errore durante il recupero dei dipendenti' };
    }
}

// ==========================================
// createEmployee
// ==========================================

/**
 * Crea un nuovo dipendente nell'azienda corrente.
 * Esegue l'hash della password con bcrypt prima di salvarla.
 * Strict Multi-tenant: associa sempre il companyId della sessione.
 */
export async function createEmployee(data: CreateEmployeeData) {
    const session = await requireAdminSession();
    const emailCheck = checkVerifiedEmail(session);
    if (!emailCheck.verified) {
        return { success: false, error: emailCheck.error };
    }

    const parsed = createEmployeeSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    const { name, email, role, password, workSchedules } = parsed.data;

    try {
        const passwordHash = await hash(password, 10);

        const newEmployee = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    companyId: session.user.companyId,
                    name,
                    email,
                    role,
                    passwordHash,
                    isActive: true,
                    specialty: parsed.data.specialty || null,
                },
            });

            // Crea gli orari di lavoro
            if (workSchedules && workSchedules.length > 0) {
                await tx.workSchedule.createMany({
                    data: workSchedules.map((ws) => ({
                        userId: user.id,
                        dayOfWeek: ws.dayOfWeek,
                        startTime: ws.startTime,
                        endTime: ws.endTime,
                    })),
                });
            }

            return tx.user.findUniqueOrThrow({
                where: { id: user.id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isActive: true,
                    specialty: true,
                    createdAt: true,
                    workSchedules: {
                        select: { dayOfWeek: true, startTime: true, endTime: true },
                        orderBy: { dayOfWeek: 'asc' },
                    },
                },
            });
        });

        revalidatePath('/dashboard/employees', 'page');

        return { success: true, data: newEmployee };
    } catch (error: unknown) {
        // Gestione email duplicata (Prisma P2002: Unique constraint violation)
        const typedError = error as { code?: string; meta?: { target?: string[] } };
        if (typedError?.code === 'P2002' && typedError?.meta?.target?.includes('email')) {
            return { success: false, error: 'Un dipendente con questa email esiste già' };
        }

        if (error instanceof Error) {
            return { success: false, error: error.message };
        }

        return { success: false, error: 'Errore durante la creazione del dipendente' };
    }
}

// ==========================================
// updateEmployee
// ==========================================

/**
 * Aggiorna nome e/o ruolo di un dipendente.
 * Se viene fornita una nuova password, la aggiorna con bcrypt.
 * Non modifica email né companyId.
 * Strict Multi-tenant: verifica che il dipendente appartenga alla company.
 */
export async function updateEmployee(id: string, data: UpdateEmployeeData) {
    const session = await requireAdminSession();
    const emailCheck = checkVerifiedEmail(session);
    if (!emailCheck.verified) {
        return { success: false, error: emailCheck.error };
    }

    const parsed = updateEmployeeSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        // Verifica che il dipendente esista e appartenga alla company
        const existingEmployee = await prisma.user.findFirst({
            where: {
                id,
                companyId: session.user.companyId,
            },
        });

        if (!existingEmployee) {
            return { success: false, error: 'Dipendente non trovato o accesso negato' };
        }

        // Costruisce il payload di aggiornamento
        const updatePayload: {
            name?: string;
            role?: Role;
            passwordHash?: string;
            specialty?: string | null;
        } = {};

        if (parsed.data.name !== undefined) updatePayload.name = parsed.data.name;
        if (parsed.data.role !== undefined) updatePayload.role = parsed.data.role;
        if (parsed.data.specialty !== undefined) updatePayload.specialty = parsed.data.specialty || null;

        if (parsed.data.password) {
            updatePayload.passwordHash = await hash(parsed.data.password, 10);
        }

        const updatedEmployee = await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id },
                data: updatePayload,
            });

            // Aggiorna gli orari di lavoro (delete + recreate)
            if (parsed.data.workSchedules !== undefined) {
                await tx.workSchedule.deleteMany({ where: { userId: id } });
                if (parsed.data.workSchedules && parsed.data.workSchedules.length > 0) {
                    await tx.workSchedule.createMany({
                        data: parsed.data.workSchedules.map((ws) => ({
                            userId: id,
                            dayOfWeek: ws.dayOfWeek,
                            startTime: ws.startTime,
                            endTime: ws.endTime,
                        })),
                    });
                }
            }

            return tx.user.findUniqueOrThrow({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isActive: true,
                    specialty: true,
                    createdAt: true,
                    workSchedules: {
                        select: { dayOfWeek: true, startTime: true, endTime: true },
                        orderBy: { dayOfWeek: 'asc' },
                    },
                },
            });
        });

        revalidatePath('/dashboard/employees', 'page');

        return { success: true, data: updatedEmployee };
    } catch (error) {
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Errore durante l\'aggiornamento del dipendente' };
    }
}

// ==========================================
// toggleEmployeeStatus (Soft Delete)
// ==========================================

/**
 * Inverte lo stato isActive di un dipendente (soft delete/restore).
 * NON elimina il record dal database.
 * Strict Multi-tenant: verifica che il dipendente appartenga alla company.
 */
export async function toggleEmployeeStatus(id: string) {
    const session = await requireAdminSession();
    const emailCheck = checkVerifiedEmail(session);
    if (!emailCheck.verified) {
        return { success: false, error: emailCheck.error };
    }

    try {
        // Recupera l'utente filtrando per id + companyId
        const employee = await prisma.user.findFirst({
            where: {
                id,
                companyId: session.user.companyId,
            },
        });

        if (!employee) {
            return { success: false, error: 'Dipendente non trovato o accesso negato' };
        }

        // Inverti isActive
        const updatedEmployee = await prisma.user.update({
            where: { id },
            data: {
                isActive: !employee.isActive,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                specialty: true,
                createdAt: true,
            },
        });

        revalidatePath('/dashboard/employees', 'page');

        return { success: true, data: updatedEmployee };
    } catch (error) {
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Errore durante l\'aggiornamento dello stato del dipendente' };
    }
}

// ==========================================
// getActiveEmployees (Per Calendario / Appuntamenti)
// ==========================================

/**
 * Recupera i dipendenti attivi dell'azienda corrente con i loro orari di lavoro.
 * NON richiede ruolo ADMIN — qualsiasi utente autenticato può usarla.
 * Usata dal calendario e dall'AppointmentSheet.
 */
export async function getActiveEmployees() {
    const session = await auth();

    if (!session?.user?.companyId) {
        throw new Error('Non autorizzato: Sessione o Company ID mancante');
    }

    try {
        const employees = await prisma.user.findMany({
            where: {
                companyId: session.user.companyId,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                role: true,
                specialty: true,
                workSchedules: {
                    select: {
                        dayOfWeek: true,
                        startTime: true,
                        endTime: true,
                    },
                    orderBy: { dayOfWeek: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        });

        return { success: true, data: employees };
    } catch (error) {
        console.error('Errore nel recupero dipendenti attivi:', error);
        return { success: false, error: 'Impossibile recuperare i dipendenti' };
    }
}
