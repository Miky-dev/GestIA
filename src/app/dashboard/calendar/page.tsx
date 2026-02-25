import { Suspense } from "react";
import SmartCalendar from "@/components/calendar/SmartCalendar";
import { getAppointments } from "@/actions/calendar";
import { getActiveEmployees } from "@/actions/employees";
import { AppointmentStatus } from "@prisma/client";

// Questa pagina è dinamica perché i dati cambiano spesso
export const dynamic = "force-dynamic";

export default async function CalendarPage() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Estendiamo un po' il range per coprire le settimane a cavallo
    const startQuery = new Date(startOfMonth);
    startQuery.setDate(startQuery.getDate() - 7);

    const endQuery = new Date(endOfMonth);
    endQuery.setDate(endQuery.getDate() + 7);

    // Fetch parallelo: appuntamenti + dipendenti attivi
    let appointments: {
        id: string;
        startTime: Date;
        endTime: Date;
        serviceType: string;
        price?: number | null;
        status: AppointmentStatus;
        userId?: string | null;
        customer: { id: string; firstName: string; lastName: string };
        user?: { id: string; name: string } | null;
    }[] = [];

    let employees: {
        id: string;
        name: string;
        role: string;
        specialty: string | null;
        workSchedules: { dayOfWeek: number; startTime: string; endTime: string }[];
    }[] = [];

    try {
        const [appointmentsResult, employeesResult] = await Promise.all([
            getAppointments(startQuery, endQuery),
            getActiveEmployees(),
        ]);

        if (appointmentsResult.success && appointmentsResult.data) {
            appointments = appointmentsResult.data.map((apt: {
                id: string;
                startTime: Date;
                endTime: Date;
                serviceType: string;
                price?: unknown;
                status: AppointmentStatus;
                userId?: string | null;
                customer: { id: string; firstName: string; lastName: string };
                user?: { id: string; name: string } | null;
            }) => ({
                id: apt.id,
                startTime: apt.startTime,
                endTime: apt.endTime,
                serviceType: apt.serviceType,
                status: apt.status,
                userId: apt.userId || null,
                customer: {
                    id: apt.customer.id,
                    firstName: apt.customer.firstName,
                    lastName: apt.customer.lastName,
                },
                user: apt.user || null,
                price: apt.price ? Number(apt.price) : null,
            }));
        }

        if (employeesResult.success && employeesResult.data) {
            employees = employeesResult.data;
        }
    } catch (error) {
        console.error("Errore recupero dati calendario:", error);
    }

    return (
        <div className="flex flex-col h-full gap-4 p-4">
            <h1 className="text-2xl font-bold">Calendario Appuntamenti</h1>
            <div className="flex-1 min-h-[600px]">
                <Suspense fallback={<div className="p-4">Caricamento calendario...</div>}>
                    <SmartCalendar events={appointments} employees={employees} />
                </Suspense>
            </div>
        </div>
    );
}
