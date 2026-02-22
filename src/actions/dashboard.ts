"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfToday, endOfToday } from "date-fns";
import { Customer, Appointment } from "@prisma/client";

export type DashboardMetrics = {
    appointmentsToday: number;
    expectedRevenue: number;
    unreadMessages: number;
    upcomingAppointments: (Appointment & { customer: Customer })[];
};

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            throw new Error("Non autorizzato");
        }

        const companyId = session.user.companyId;
        const todayStart = startOfToday();
        const todayEnd = endOfToday();

        const [
            appointmentsTodayCount,
            revenueAggregation,
            unreadMessagesCount,
            upcomingAppointments
        ] = await Promise.all([
            // 1. Conto degli appuntamenti di oggi
            prisma.appointment.count({
                where: {
                    companyId,
                    startTime: {
                        gte: todayStart,
                        lte: todayEnd
                    }
                }
            }),

            // 2. Ricavo previsto per oggi (somma prezzi degli appuntamenti completati o programmati)
            prisma.appointment.aggregate({
                where: {
                    companyId,
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

            // 3. Messaggi da leggere / Conversazioni Aperte o Pendenti
            prisma.conversation.count({
                where: {
                    companyId,
                    status: {
                        in: ["OPEN", "PENDING"]
                    }
                }
            }),

            // 4. Prossimi 5 appuntamenti di oggi
            prisma.appointment.findMany({
                where: {
                    companyId,
                    startTime: {
                        gte: new Date(), // Solo quelli da adesso in poi
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
            })
        ]);

        return {
            appointmentsToday: appointmentsTodayCount,
            expectedRevenue: revenueAggregation._sum.price ? Number(revenueAggregation._sum.price) : 0,
            unreadMessages: unreadMessagesCount,
            upcomingAppointments
        };

    } catch (error) {
        console.error("Errore durante il recupero delle metriche della dashboard:", error);
        return {
            appointmentsToday: 0,
            expectedRevenue: 0,
            unreadMessages: 0,
            upcomingAppointments: []
        };
    }
}
