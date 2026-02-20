"use client";

import { useRef, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
// @ts-expect-error type declarations for FullCalendar locale are not available
import itLocale from "@fullcalendar/core/locales/it";

import { AppointmentSheet } from "./AppointmentSheet";
import { updateAppointmentDates } from "@/actions/calendar";
import { useToast } from "@/hooks/use-toast";

// Stili personalizzati per FullCalendar
import "@/app/globals.css";

interface Appointment {
    id: string;
    startTime: Date;
    endTime: Date;
    customer: {
        id: string; // Ensure id is here
        firstName: string;
        lastName: string;
    };
    serviceType: string;
    status: string;
    price?: number | null; // Add price
}

interface SmartCalendarProps {
    events: Appointment[];
}

export default function SmartCalendar({ events }: SmartCalendarProps) {
    const calendarRef = useRef<FullCalendar>(null);
    const { toast } = useToast();
    // Placeholder if router was needed, removing router

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    // Expand state type to include all needed fields
    const [selectedSlot, setSelectedSlot] = useState<{
        id?: string;
        start: Date;
        end: Date;
        customerId?: string;
        serviceType?: string;
        price?: number | null;
        customerName?: string;
    } | null>(null);

    // Mappa gli eventi del DB nel formato FullCalendar
    const calendarEvents = useMemo(() => {
        return events.map((evt) => ({
            id: evt.id,
            title: `${evt.customer.firstName} ${evt.customer.lastName} - ${evt.serviceType}`,
            start: new Date(evt.startTime),
            end: new Date(evt.endTime),
            backgroundColor: "hsl(var(--primary))",
            borderColor: "hsl(var(--primary))",
            textColor: "hsl(var(--primary-foreground))",
            extendedProps: {
                status: evt.status,
                serviceType: evt.serviceType,
                customerId: evt.customer.id,
                price: evt.price,
                customerName: `${evt.customer.firstName} ${evt.customer.lastName}`,
            },
        }));
    }, [events]);

    const handleDateSelect = (selectInfo: { start: Date; end: Date; view: { calendar: { unselect: () => void } } }) => {
        setSelectedSlot({
            start: selectInfo.start,
            end: selectInfo.end,
        });
        setIsSheetOpen(true);
        const calendarApi = selectInfo.view.calendar;
        calendarApi.unselect();
    };

    const handleEventClick = (clickInfo: { event: { id: string; start: Date; end: Date; extendedProps: { customerId: string; serviceType: string; price?: number | null; customerName: string; } } }) => {
        const event = clickInfo.event;
        const props = event.extendedProps;

        setSelectedSlot({
            id: event.id,
            start: event.start,
            end: event.end,
            customerId: props.customerId,
            serviceType: props.serviceType,
            price: props.price,
            customerName: props.customerName,
        });
        setIsSheetOpen(true);
    };

    const handleEventDrop = async (dropInfo: { event: { id: string; start: Date; end: Date }; revert: () => void }) => {
        const { event } = dropInfo;
        const newStart = event.start;
        const newEnd = event.end;

        try {
            const result = await updateAppointmentDates(event.id, newStart, newEnd);

            if (result.success) {
                toast({
                    title: "Appuntamento spostato",
                    description: `Dalle ${newStart.toLocaleTimeString()} alle ${newEnd.toLocaleTimeString()}`,
                });
            } else {
                dropInfo.revert();
                toast({
                    variant: "destructive",
                    title: "Errore",
                    description: result.error || "Impossibile spostare l'appuntamento.",
                });
            }
        } catch (error) {
            console.error("Errore drag & drop:", error);
            dropInfo.revert();
            toast({
                variant: "destructive",
                title: "Errore",
                description: "Errore di connessione.",
            });
        }
    };

    const handleEventResize = async (resizeInfo: { event: { id: string; start: Date; end: Date }; revert: () => void }) => {
        const { event } = resizeInfo;
        const newStart = event.start;
        const newEnd = event.end;

        try {
            const result = await updateAppointmentDates(event.id, newStart, newEnd);

            if (result.success) {
                toast({
                    title: "Durata aggiornata",
                    description: `Nuova fine: ${newEnd.toLocaleTimeString()}`,
                });
            } else {
                resizeInfo.revert();
                toast({
                    variant: "destructive",
                    title: "Errore",
                    description: result.error || "Impossibile ridimensionare l'appuntamento.",
                });
            }
        } catch (error) {
            console.error("Errore resize:", error);
            resizeInfo.revert();
            toast({
                variant: "destructive",
                title: "Errore",
                description: "Errore di connessione.",
            });
        }
    };

    return (
        <div className="w-full h-full bg-background rounded-lg border shadow-sm p-4 calendar-wrapper relative">
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
                    cursor: pointer;
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
                height="auto"
                stickyHeaderDates={true}
                nowIndicator={true}
                selectable={true}
                selectMirror={true}
                editable={true}
                dayMaxEvents={true}
                select={handleDateSelect}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                eventClick={handleEventClick}
            />

            <AppointmentSheet
                isOpen={isSheetOpen}
                onClose={() => {
                    setIsSheetOpen(false);
                    setSelectedSlot(null);
                }}
                initialData={selectedSlot}
            />
        </div>
    );
}
