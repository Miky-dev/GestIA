"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Definizioni dei tipi per l'input (evitiamo any)
export type CreateCustomerData = {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    internalNotes?: string;
    birthDate?: Date;
    gender?: string;
    fiscalCode?: string;
    vatNumber?: string;
};

export type UpdateCustomerData = Partial<CreateCustomerData>;

/**
 * Recupera tutti i clienti della company corrente.
 */
export async function getCustomers() {
    const session = await auth();
    if (!session?.user?.companyId) {
        throw new Error("Unauthorized");
    }

    // Multi-tenant strict: filtro sempre per companyId
    return await prisma.customer.findMany({
        where: {
            companyId: session.user.companyId,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}

/**
 * Recupera un singolo cliente per ID, assicurandosi che appartenga alla company corrente.
 */
export async function getCustomerById(id: string) {
    const session = await auth();
    if (!session?.user?.companyId) {
        throw new Error("Unauthorized");
    }

    const customer = await prisma.customer.findFirst({
        where: {
            id,
            companyId: session.user.companyId, // Multi-tenant check
        },
    });

    return customer;
}

/**
 * Crea un nuovo cliente.
 */
export async function createCustomer(data: CreateCustomerData) {
    const session = await auth();
    if (!session?.user?.companyId) {
        throw new Error("Unauthorized");
    }

    // Formattazione telefono (E.164 base per Italia se manca prefisso)
    let phoneE164 = data.phone.trim().replace(/\s+/g, "");
    if (!phoneE164.startsWith("+")) {
        phoneE164 = "+39" + phoneE164;
    }

    const newCustomer = await prisma.customer.create({
        data: {
            companyId: session.user.companyId, // Force companyId from session
            firstName: data.firstName,
            lastName: data.lastName,
            phoneE164,
            email: data.email || null,
            internalNotes: data.internalNotes || null,
            birthDate: data.birthDate || null,
            gender: data.gender || null,
            fiscalCode: data.fiscalCode ? data.fiscalCode.toUpperCase() : null,
            vatNumber: data.vatNumber || null,
        },
    });

    revalidatePath("/dashboard/customers");
    return newCustomer;
}

/**
 * Aggiorna un cliente esistente.
 */
export async function updateCustomer(id: string, data: UpdateCustomerData) {
    const session = await auth();
    if (!session?.user?.companyId) {
        throw new Error("Unauthorized");
    }

    // Verifica esistenza e appartenenza (Multi-tenant check preventivo)
    const existingCustomer = await prisma.customer.findFirst({
        where: {
            id,
            companyId: session.user.companyId,
        },
    });

    if (!existingCustomer) {
        throw new Error("Customer not found or access denied");
    }

    // Formattazione telefono se presente
    let phoneE164 = undefined;
    if (data.phone) {
        phoneE164 = data.phone.trim().replace(/\s+/g, "");
        if (!phoneE164.startsWith("+")) {
            phoneE164 = "+39" + phoneE164;
        }
    }

    const updatedCustomer = await prisma.customer.update({
        where: { id }, // Qui usiamo ID perché abbiamo già verificato l'ownership sopra
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phoneE164: phoneE164,
            email: data.email,
            internalNotes: data.internalNotes,
            birthDate: data.birthDate,
            gender: data.gender,
            fiscalCode: data.fiscalCode ? data.fiscalCode.toUpperCase() : undefined,
            vatNumber: data.vatNumber,
        },
    });

    revalidatePath("/dashboard/customers");
    return updatedCustomer;
}

/**
 * Elimina un cliente.
 */
export async function deleteCustomer(id: string) {
    const session = await auth();
    if (!session?.user?.companyId) {
        throw new Error("Unauthorized");
    }

    // Multi-tenant check con deleteMany (più sicuro in una chiamata sola se l'ID non è unique per company,
    // ma qui ID è UUID globale quindi findFirst + delete oppure deleteMany è ok.
    // deleteMany ritorna count, noi vogliamo essere sicuri di aver cancellato.)
    const deleted = await prisma.customer.deleteMany({
        where: {
            id,
            companyId: session.user.companyId,
        },
    });

    if (deleted.count === 0) {
        throw new Error("Customer not found or access denied");
    }

    revalidatePath("/dashboard/customers");
    return { success: true };
}
