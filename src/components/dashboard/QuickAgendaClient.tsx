"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Appointment, Customer, AppointmentStatus } from "@prisma/client";
import { AppointmentSheet } from "@/components/calendar/AppointmentSheet";
import { Clock } from "lucide-react";

type QuickAgendaAppointment = Appointment & { customer: Customer };

interface QuickAgendaClientProps {
    appointments: QuickAgendaAppointment[];
}

export function QuickAgendaClient({ appointments }: QuickAgendaClientProps) {
    const [selectedAppointment, setSelectedAppointment] = useState<QuickAgendaAppointment | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const handleAppointmentClick = (appointment: QuickAgendaAppointment) => {
        setSelectedAppointment(appointment);
        setIsSheetOpen(true);
    };

    return (
        <>
            {appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/30">
                    <Clock className="w-10 h-10 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium text-foreground">Nessun appuntamento previsto</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        Non hai appuntamenti in programma per il resto della giornata.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {appointments.map((appointment) => (
                        <div
                            key={appointment.id}
                            onClick={() => handleAppointmentClick(appointment)}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="font-semibold text-foreground min-w-[60px]">
                                    {format(new Date(appointment.startTime), "HH:mm")}
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">
                                        {appointment.customer.firstName} {appointment.customer.lastName}
                                    </p>
                                </div>
                            </div>
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                {appointment.serviceType}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AppointmentSheet
                isOpen={isSheetOpen}
                onClose={() => {
                    setIsSheetOpen(false);
                    setSelectedAppointment(null);
                }}
                initialData={
                    selectedAppointment
                        ? {
                            id: selectedAppointment.id,
                            start: new Date(selectedAppointment.startTime),
                            end: new Date(selectedAppointment.endTime),
                            customerId: selectedAppointment.customerId,
                            serviceType: selectedAppointment.serviceType,
                            price: selectedAppointment.price ? Number(selectedAppointment.price) : null,
                            status: selectedAppointment.status as AppointmentStatus,
                            customerName: `${selectedAppointment.customer.firstName} ${selectedAppointment.customer.lastName}`,
                        }
                        : null
                }
            />
        </>
    );
}
