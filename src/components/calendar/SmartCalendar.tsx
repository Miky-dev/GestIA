"use client";

import { useRef, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import itLocale from "@fullcalendar/core/locales/it";

// Stili personalizzati per FullCalendar (vanno creati/importati, 
// o usiamo global.css se configurato, qui metto un blocco style jsx per isolamento rapido o classi tailwind wrapper)
import "@/app/globals.css"; // Assicura che le variabili CSS siano disponibili

interface Appointment {
    id: string;
    startTime: Date;
    endTime: Date;
    customer: {
        firstName: string;
        lastName: string;
    };
    serviceType: string;
    status: string;
}

interface SmartCalendarProps {
    events: Appointment[];
}

export default function SmartCalendar({ events }: SmartCalendarProps) {
    const calendarRef = useRef<FullCalendar>(null);

    // Mappa gli eventi del DB nel formato FullCalendar
    const calendarEvents = useMemo(() => {
        return events.map((evt) => ({
            id: evt.id,
            title: `${evt.customer.firstName} ${evt.customer.lastName} - ${evt.serviceType}`,
            start: new Date(evt.startTime),
            end: new Date(evt.endTime),
            // Personalizzazione colori (puoi espandere con logica basata su status o serviceType)
            backgroundColor: "hsl(var(--primary))",
            borderColor: "hsl(var(--primary))",
            textColor: "hsl(var(--primary-foreground))",
            extendedProps: {
                status: evt.status,
                serviceType: evt.serviceType,
            }
        }));
    }, [events]);

    return (
        <div className="w-full h-full bg-background rounded-lg border shadow-sm p-4 calendar-wrapper">
            <style jsx global>{`
                .fc {
                    --fc-border-color: hsl(var(--border));
                    --fc-button-text-color: hsl(var(--primary-foreground));
                    --fc-button-bg-color: hsl(var(--primary));
                    --fc-button-border-color: hsl(var(--primary));
                    --fc-button-hover-bg-color: hsl(var(--primary) / 0.9);
                    --fc-button-hover-border-color: hsl(var(--primary) / 0.9);
                    --fc-button-active-bg-color: hsl(var(--primary) / 0.8);
                    --fc-button-active-border-color: hsl(var(--primary) / 0.8);
                    --fc-event-bg-color: hsl(var(--primary));
                    --fc-event-border-color: hsl(var(--primary));
                    --fc-today-bg-color: hsl(var(--muted) / 0.3);
                    --fc-neutral-bg-color: hsl(var(--background));
                    --fc-list-event-hover-bg-color: hsl(var(--muted));
                    font-family: var(--font-sans), system-ui, sans-serif;
                }
                .fc-theme-standard .fc-scrollgrid {
                    border-color: hsl(var(--border));
                }
                .fc th {
                    text-align: left;
                    padding: 0.5rem;
                }
                .fc-col-header-cell-cushion {
                    color: hsl(var(--foreground));
                    font-weight: 600;
                }
                .fc-timegrid-slot-label-cushion {
                    color: hsl(var(--muted-foreground));
                    font-size: 0.875rem;
                }
                .fc-event {
                    border-radius: var(--radius);
                    padding: 2px 4px;
                    font-size: 0.875rem;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
            `}</style>

            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                locale={itLocale}
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                allDaySlot={false}
                events={calendarEvents}
                height="auto" // O "100%" se il container ha altezza fissa
                stickyHeaderDates={true}
                nowIndicator={true}

                // Placeholder per interazioni future
                dateClick={(arg) => console.log("Date click:", arg.dateStr)}
                eventClick={(arg) => console.log("Event click:", arg.event.title)}
            />
        </div>
    );
}
