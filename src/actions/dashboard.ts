"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfToday, endOfToday } from "date-fns";
import { Customer, Appointment, Task } from "@prisma/client";

export type DashboardMetrics = {
    appointmentsToday: number;
    expectedRevenue: number;
    unreadMessages: number;
    upcomingAppointments: (Appointment & { customer: Customer })[];
    overdueTasksCount: number;
    urgentTasks: (Task & { customer: Customer | null })[];
};

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            throw new Error("Non autorizzato");
        }

        const companyId = session.user.companyId;
        const userRole = session.user.role;
        const userId = session.user.id;
        const todayStart = startOfToday();
        const todayEnd = endOfToday();

        // Base filter: EMPLOYEE vede solo i propri appuntamenti
        const appointmentBaseFilter: Record<string, unknown> = { companyId };
        if (userRole === 'EMPLOYEE') {
            appointmentBaseFilter.userId = userId;
        }

        const [
            appointmentsTodayCount,
            revenueAggregation,
            unreadMessagesCount,
            upcomingAppointments,
            overdueTasksCount,
            urgentTasks
        ] = await Promise.all([
            // 1. Conto degli appuntamenti di oggi
            prisma.appointment.count({
                where: {
                    ...appointmentBaseFilter,
                    startTime: {
                        gte: todayStart,
                        lte: todayEnd
                    }
                }
            }),

            // 2. Ricavo previsto per oggi (somma prezzi degli appuntamenti completati o programmati)
            prisma.appointment.aggregate({
                where: {
                    ...appointmentBaseFilter,
                    startTime: {
                        gte: todayStart,
                        lte: todayEnd
                    },
                    status: {
                        in: ["SCHEDULED", "COMPLETED"]
                    }
                },
                _sum: {
                    price: true
                }
            }),

            // 3. Messaggi non letti (INBOUND con status DELIVERED = non ancora aperti)
            prisma.message.count({
                where: {
                    companyId,
                    direction: "INBOUND",
                    status: "DELIVERED",
                }
            }),

            // 4. Prossimi 5 appuntamenti di oggi
            prisma.appointment.findMany({
                where: {
                    ...appointmentBaseFilter,
                    startTime: {
                        gte: new Date(),
                        lte: todayEnd
                    },
                    status: "SCHEDULED"
                },
                orderBy: {
                    startTime: "asc"
                },
                take: 5,
                include: {
                    customer: true
                }
            }),

            // 5. Task Scaduti
            prisma.task.count({
                where: {
                    companyId,
                    isArchived: false,
                    status: {
                        not: "DONE"
                    },
                    dueDate: {
                        lt: todayStart
                    }
                }
            }),

            // 6. Task di oggi o urgenti
            prisma.task.findMany({
                where: {
                    companyId,
                    isArchived: false,
                    status: {
                        not: "DONE"
                    },
                    dueDate: {
                        lte: todayEnd
                    }
                },
                orderBy: [
                    { priority: "desc" },
                    { dueDate: "asc" }
                ],
                take: 5,
                include: {
                    customer: true
                }
            })
        ]);

        return {
            appointmentsToday: appointmentsTodayCount,
            expectedRevenue: revenueAggregation._sum.price ? Number(revenueAggregation._sum.price) : 0,
            unreadMessages: unreadMessagesCount,
            upcomingAppointments,
            overdueTasksCount,
            urgentTasks
        };

    } catch (error) {
        console.error("Errore durante il recupero delle metriche della dashboard:", error);
        return {
            appointmentsToday: 0,
            expectedRevenue: 0,
            unreadMessages: 0,
            upcomingAppointments: [],
            overdueTasksCount: 0,
            urgentTasks: []
        };
    }
}
