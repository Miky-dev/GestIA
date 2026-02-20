"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { customerSchema } from "@/lib/schemas";
import type { CreateCustomerData, UpdateCustomerData } from "@/lib/schemas";

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

    const parsed = customerSchema.safeParse(data);
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0].message);
    }

    // Formattazione telefono (E.164 base per Italia se manca prefisso)
    let phoneE164 = parsed.data.phone.trim().replace(/\s+/g, "");
    if (!phoneE164.startsWith("+")) {
        phoneE164 = "+39" + phoneE164;
    }

    const newCustomer = await prisma.customer.create({
        data: {
            companyId: session.user.companyId, // Force companyId from session
            firstName: parsed.data.firstName,
            lastName: parsed.data.lastName,
            phoneE164,
            email: parsed.data.email || null,
            internalNotes: parsed.data.internalNotes || null,
            birthDate: parsed.data.birthDate || null,
            gender: parsed.data.gender || null,
            fiscalCode: parsed.data.fiscalCode ? parsed.data.fiscalCode.toUpperCase() : null,
            vatNumber: parsed.data.vatNumber || null,
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

    const parsed = customerSchema.partial().safeParse(data);
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0].message);
    }

    // Formattazione telefono se presente
    let phoneE164 = undefined;
    if (parsed.data.phone) {
        phoneE164 = parsed.data.phone.trim().replace(/\s+/g, "");
        if (!phoneE164.startsWith("+")) {
            phoneE164 = "+39" + phoneE164;
        }
    }

    const updatedCustomer = await prisma.customer.update({
        where: { id }, // Qui usiamo ID perché abbiamo già verificato l'ownership sopra
        data: {
            firstName: parsed.data.firstName,
            lastName: parsed.data.lastName,
            phoneE164: phoneE164,
            email: parsed.data.email,
            internalNotes: parsed.data.internalNotes,
            birthDate: parsed.data.birthDate,
            gender: parsed.data.gender,
            fiscalCode: parsed.data.fiscalCode ? parsed.data.fiscalCode.toUpperCase() : undefined,
            vatNumber: parsed.data.vatNumber,
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
