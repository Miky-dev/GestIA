"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AnalyticsData = {
    revenue: number;
    lostRevenue: number;
    appointmentsByStatus: {
        status: string;
        count: number;
    }[];
    topServices: {
        serviceType: string;
        count: number;
    }[];
    staffPerformance: {
        userId: string;
        userName: string;
        completedAppointments: number;
        generatedRevenue: number;
    }[];
    newCustomers: number;
    revenueOverTime: {
        date: string;
        revenue: number;
        lostRevenue: number;
    }[];
};

/**
 * Motore Analitico Principale
 * Aggrega metriche di business avanzate.
 * Accessibile SOLO ad utenti con ruolo ADMIN.
 */
export async function getBusinessAnalytics(startDate: Date, endDate: Date): Promise<AnalyticsData> {
    const session = await auth();

    // Protezione Strict Role-Based Access Control (RBAC) e Multi-tenant
    if (!session?.user?.companyId) {
        throw new Error("Unauthorized: Nessuna azienda associata.");
    }

    if (session.user.role !== "ADMIN") {
        throw new Error("Forbidden: Solo gli amministratori possono visualizzare le statistiche finanziarie.");
    }

    const companyId = session.user.companyId;

    // Eseguire le aggregazioni parallele sul DB
    const [
        revenueResult,
        lostRevenueResult,
        statusGroupResult,
        topServicesResult,
        staffGroupResult,
        newCustomersResult,
        appointmentsDataResult
    ] = await Promise.all([
        // 1. Revenue: Denaro generato (COMPLETED)
        prisma.appointment.aggregate({
            where: {
                companyId,
                status: "COMPLETED",
                startTime: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _sum: {
                price: true
            }
        }),

        // 2. Lost Revenue: Denaro Perso (NO_SHOW, CANCELLED)
        prisma.appointment.aggregate({
            where: {
                companyId,
                status: {
                    in: ["NO_SHOW", "CANCELLED"]
                },
                startTime: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _sum: {
                price: true
            }
        }),

        // 3. Appointments By Status: Count by status
        prisma.appointment.groupBy({
            by: ["status"],
            where: {
                companyId,
                startTime: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _count: {
                id: true
            }
        }),

        // 4. Top Services: I 5 servizi più venduti
        prisma.appointment.groupBy({
            by: ["serviceType"],
            where: {
                companyId,
                status: "COMPLETED",
                startTime: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: "desc"
                }
            },
            take: 5
        }),

        // 5. Staff Performance: Raggruppamento base per userId
        prisma.appointment.groupBy({
            by: ["userId"],
            where: {
                companyId,
                status: "COMPLETED",
                startTime: {
                    gte: startDate,
                    lte: endDate
                },
                userId: {
                    not: null
                }
            },
            _count: {
                id: true
            },
            _sum: {
                price: true
            }
        }),

        // 6. New Customers: Nuovi clienti acquisiti nel periodo per il Tenant
        prisma.customer.count({
            where: {
                companyId,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        }),

        // 7. Griglia temporale (Giorno per giorno) per le charts
        // Questa query tira fuori gli appuntamenti in range per aggregazione manuale
        prisma.appointment.findMany({
            where: {
                companyId,
                startTime: {
                    gte: startDate,
                    lte: endDate
                },
                status: {
                    in: ["COMPLETED", "NO_SHOW", "CANCELLED"]
                }
            },
            select: {
                startTime: true,
                price: true,
                status: true
            },
            orderBy: {
                startTime: "asc"
            }
        })
    ]);

    // Data Transformation: Post-processing dei risultati dallo step di Staff Performance
    const userIds = staffGroupResult.map(s => s.userId).filter((id): id is string => id !== null);

    // Recupero i nomi degli utenti (Solo all'interno del tenant)
    const users = await prisma.user.findMany({
        where: {
            id: {
                in: userIds
            },
            companyId
        },
        select: {
            id: true,
            name: true
        }
    });

    // Mappa O(1) per lookup utente
    const userMap = new Map(users.map(u => [u.id, u.name]));

    // Assemblo il risultato finale dello staff
    const staffPerformance = staffGroupResult.map(staff => ({
        userId: staff.userId as string,
        userName: userMap.get(staff.userId as string) || "Operatore Sconosciuto",
        completedAppointments: staff._count.id,
        generatedRevenue: staff._sum.price ? Number(staff._sum.price) : 0
    })).sort((a, b) => b.generatedRevenue - a.generatedRevenue);

    // Elaborazione Time Series (Revenue Over Time)
    const rawAppointmentsData = appointmentsDataResult as { startTime: Date, price: import('@prisma/client/runtime/library').Decimal | null, status: string }[] || [];

    // Raggruppiamo i dati per data formattata 'yyyy-MM-dd'
    const timeSeriesMap = new Map<string, { revenue: number, lost: number }>();

    rawAppointmentsData.forEach(app => {
        const dayKey = app.startTime.toISOString().split("T")[0]; // YYYY-MM-DD
        const priceNum = app.price ? Number(app.price) : 0;

        const existing = timeSeriesMap.get(dayKey) || { revenue: 0, lost: 0 };

        if (app.status === "COMPLETED") {
            existing.revenue += priceNum;
        } else if (app.status === "NO_SHOW" || app.status === "CANCELLED") {
            existing.lost += priceNum;
        }

        timeSeriesMap.set(dayKey, existing);
    });

    const revenueOverTime = Array.from(timeSeriesMap.entries())
        .map(([date, data]) => ({
            date,
            revenue: data.revenue,
            lostRevenue: data.lost
        }))
        .sort((a, b) => a.date.localeCompare(b.date)); // Sort chronologically

    // Costruiamo e restituiamo l'oggetto finale pulito per il Frontend
    return {
        revenue: revenueResult._sum.price ? Number(revenueResult._sum.price) : 0,
        lostRevenue: lostRevenueResult._sum.price ? Number(lostRevenueResult._sum.price) : 0,
        appointmentsByStatus: statusGroupResult.map(item => ({
            status: item.status,
            count: item._count.id
        })),
        topServices: topServicesResult.map(item => ({
            serviceType: item.serviceType,
            count: item._count.id
        })),
        staffPerformance,
        newCustomers: newCustomersResult as number,
        revenueOverTime
    };
}
