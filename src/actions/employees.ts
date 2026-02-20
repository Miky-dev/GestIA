'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcrypt';

// ==========================================
// TIPI
// ==========================================

interface CreateEmployeeData {
    name: string;
    email: string;
    role: Role;
    password: string;
}

interface UpdateEmployeeData {
    name?: string;
    role?: Role;
    password?: string;
}

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
 * Lancia errore con messaggio UI-friendly se non verificata.
 */
async function requireVerifiedEmail(session: Awaited<ReturnType<typeof requireAdminSession>>) {
    if (!session.user.isEmailVerified) {
        throw new Error('EMAIL_NOT_VERIFIED: Verifica la tua email per eseguire questa operazione.');
    }
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
                createdAt: true,
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
    await requireVerifiedEmail(session);

    const { name, email, role, password } = data;

    if (!name || !email || !role || !password) {
        return { success: false, error: 'Tutti i campi (nome, email, ruolo, password) sono obbligatori' };
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);

        const newEmployee = await prisma.user.create({
            data: {
                companyId: session.user.companyId,
                name,
                email,
                role,
                passwordHash,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });

        revalidatePath('/dashboard/employees', 'page');

        return { success: true, data: newEmployee };
    } catch (error: any) {
        // Gestione email duplicata (Prisma P2002: Unique constraint violation)
        if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
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
    await requireVerifiedEmail(session);

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
        } = {};

        if (data.name !== undefined) updatePayload.name = data.name;
        if (data.role !== undefined) updatePayload.role = data.role;

        if (data.password) {
            updatePayload.passwordHash = await bcrypt.hash(data.password, 10);
        }

        const updatedEmployee = await prisma.user.update({
            where: { id },
            data: updatePayload,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
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
    await requireVerifiedEmail(session);

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
