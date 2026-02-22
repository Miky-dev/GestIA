import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { simulateWhatsAppReminder } from "@/lib/services/whatsapp";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 1 minuto

export async function GET(request: NextRequest) {
    // 1. Authorization
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 2. Calcolo Range: Domani (da now + 24h a now + 48h)
        const now = new Date();
        const tomorrowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const tomorrowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        // 3. Recupero appuntamenti "SCHEDULED" non notificati del domani
        const appointmentsToRemind = await prisma.appointment.findMany({
            where: {
                status: "SCHEDULED",
                reminderSent: false,
                startTime: {
                    gte: tomorrowStart,
                    lt: tomorrowEnd,
                },
            },
        });

        if (appointmentsToRemind.length === 0) {
            return NextResponse.json({
                success: true,
                processed: 0,
                successful: 0,
                failed: 0,
                message: "Nessun appuntamento in scadenza domani."
            });
        }

        // 4. Batch Processing con Promise.allSettled
        const results = await Promise.allSettled(
            appointmentsToRemind.map(appointment => simulateWhatsAppReminder(appointment.id))
        );

        // 5. Analisi Statistiche
        let successful = 0;
        let failed = 0;

        results.forEach(result => {
            if (result.status === "fulfilled" && result.value.success) {
                successful++;
            } else {
                failed++;
            }
        });

        // 6. Ritorno report riassuntivo
        return NextResponse.json({
            success: true,
            processed: appointmentsToRemind.length,
            successful,
            failed,
        });

    } catch (error) {
        console.error("[CRON REMINDERS] Error executing job:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
