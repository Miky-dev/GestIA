"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createTaskSchema, updateTaskSchema } from "@/lib/schemas";
import type { CreateTaskData, UpdateTaskData } from "@/lib/schemas";
import { TaskStatus, Prisma } from "@prisma/client";

/**
 * Recupera tutti i task della company corrente (non archiviati).
 */
export async function getTasks(filters?: { status?: string; assigneeId?: string }) {
    const session = await auth();
    if (!session?.user?.companyId) {
        throw new Error("Unauthorized");
    }

    // Clausola whre Strict Multi-tenant
    const whereClause: Prisma.TaskWhereInput = {
        companyId: session.user.companyId,
        isArchived: false,
    };

    if (filters?.status) {
        whereClause.status = filters.status as TaskStatus;
    }

    if (filters?.assigneeId) {
        whereClause.assigneeId = filters.assigneeId;
    }

    return await prisma.task.findMany({
        where: whereClause,
        include: {
            assignee: {
                select: { name: true },
            },
            customer: {
                select: { firstName: true, lastName: true, phoneE164: true },
            },
            appointment: {
                select: { startTime: true, serviceType: true },
            },
        },
        orderBy: {
            dueDate: "asc",
        },
    });
}

/**
 * Crea un nuovo task.
 */
export async function createTask(data: CreateTaskData) {
    const session = await auth();
    if (!session?.user?.companyId) {
        throw new Error("Unauthorized");
    }

    const parsed = createTaskSchema.safeParse(data);
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0].message);
    }

    const newTask = await prisma.task.create({
        data: {
            companyId: session.user.companyId,
            title: parsed.data.title,
            description: parsed.data.description,
            dueDate: parsed.data.dueDate,
            priority: parsed.data.priority,
            status: parsed.data.status,
            assigneeId: parsed.data.assigneeId,
            customerId: parsed.data.customerId,
            appointmentId: parsed.data.appointmentId,
            conversationId: parsed.data.conversationId,
        },
    });

    revalidatePath("/dashboard/tasks");
    return newTask;
}

/**
 * Aggiorna lo stato di un task.
 */
export async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
    const session = await auth();
    if (!session?.user?.companyId) {
        throw new Error("Unauthorized");
    }

    // Verifica strict multi-tenant
    const task = await prisma.task.findFirst({
        where: { id: taskId, companyId: session.user.companyId },
    });

    if (!task) {
        throw new Error("Task not found or unauthorized");
    }

    const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
            status: newStatus,
            completedAt: newStatus === "DONE" ? new Date() : null,
        },
    });

    revalidatePath("/dashboard/tasks");
    return updatedTask;
}
