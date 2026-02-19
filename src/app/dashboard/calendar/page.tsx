import { Suspense } from "react";
import SmartCalendar from "@/components/calendar/SmartCalendar";
import { getAppointments } from "@/actions/calendar";

// Questa pagina è dinamica perché i dati cambiano spesso
export const dynamic = "force-dynamic";

export default async function CalendarPage() {
    // Calcola il range del mese corrente (o un range più ampio per sicurezza)
    // FullCalendar gestisce la vista, ma noi dobbiamo passare gli eventi. 
    // Per ora carichiamo un range ampio (es. mese corrente +/- 1 mese) o tutto se non ci sono troppi dati.
    // L'utente ha chiesto "mese corrente".

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Estendiamo un po' il range per coprire le settimane a cavallo
    const startQuery = new Date(startOfMonth);
    startQuery.setDate(startQuery.getDate() - 7);

    const endQuery = new Date(endOfMonth);
    endQuery.setDate(endQuery.getDate() + 7);

    let appointments: any[] = [];
    try {
        const result = await getAppointments(startQuery, endQuery);
        if (result.success && result.data) {
            // Converti i dati per evitare errori di serializzazione (Decimal di Prisma)
            appointments = result.data.map((apt: any) => ({
                id: apt.id,
                startTime: apt.startTime,
                endTime: apt.endTime,
                serviceType: apt.serviceType,
                status: apt.status,
                customer: {
                    firstName: apt.customer.firstName,
                    lastName: apt.customer.lastName,
                },
                // Se servisse il prezzo in futuro, convertilo qui:
                // price: apt.price ? Number(apt.price) : null,
            }));
        }
    } catch (error) {
        console.error("Errore recupero appuntamenti:", error);
    }

    return (
        <div className="flex flex-col h-full gap-4 p-4">
            <h1 className="text-2xl font-bold">Calendario Appuntamenti</h1>
            <div className="flex-1 min-h-[600px]">
                <Suspense fallback={<div className="p-4">Caricamento calendario...</div>}>
                    <SmartCalendar events={appointments} />
                </Suspense>
            </div>
        </div>
    );
}
