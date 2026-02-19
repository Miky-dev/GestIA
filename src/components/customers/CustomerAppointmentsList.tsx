"use client";

import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarDays, Edit, MoreVertical, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppointmentSheet } from "@/components/calendar/AppointmentSheet";

interface Appointment {
    id: string;
    startTime: Date;
    endTime: Date;
    serviceType: string;
    price: number | null;
    status: string;
    customerId: string;
}

interface CustomerAppointmentsListProps {
    appointments: Appointment[];
    customerId: string;
    customerName: string;
}

export function CustomerAppointmentsList({
    appointments,
    customerId,
    customerName,
}: CustomerAppointmentsListProps) {
    const router = useRouter();
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const handleEdit = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setIsSheetOpen(true);
    };

    const handleSheetClose = () => {
        setIsSheetOpen(false);
        setSelectedAppointment(null);
        router.refresh(); // Ricarica la pagina per aggiornare la lista
    };

    // Helper per formattare lo stato
    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            SCHEDULED: "bg-blue-100 text-blue-700 border-blue-200",
            COMPLETED: "bg-green-100 text-green-700 border-green-200",
            CANCELLED: "bg-red-100 text-red-700 border-red-200",
            NO_SHOW: "bg-zinc-100 text-zinc-700 border-zinc-200",
        };
        const labels: Record<string, string> = {
            SCHEDULED: "Programmato",
            COMPLETED: "Completato",
            CANCELLED: "Cancellato",
            NO_SHOW: "No Show",
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || "bg-gray-100 text-gray-700"}`}>
                {labels[status] || status}
            </span>
        );
    };

    if (appointments.length === 0) {
        return (
            <>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <CalendarDays className="h-5 w-5 text-zinc-500" />
                            Prossimi Appuntamenti
                        </CardTitle>
                        <CardDescription>Gestisci le prenotazioni e gli incontri.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64 flex flex-col items-center justify-center bg-zinc-50/50 rounded-lg border border-dashed border-zinc-200 mx-6 mb-6">
                        <div className="text-center text-zinc-400">
                            <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Nessun appuntamento trovato per questo cliente.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Sheet nascosto per eventuali create futuri da qui, anche se per ora editiamo solo */}
                <AppointmentSheet
                    isOpen={isSheetOpen}
                    onClose={handleSheetClose}
                    initialData={selectedAppointment ? {
                        id: selectedAppointment.id,
                        start: new Date(selectedAppointment.startTime),
                        end: new Date(selectedAppointment.endTime),
                        customerId: selectedAppointment.customerId,
                        serviceType: selectedAppointment.serviceType,
                        price: selectedAppointment.price,
                        customerName: customerName
                    } : null}
                />
            </>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <CalendarDays className="h-5 w-5 text-zinc-500" />
                        Storico Appuntamenti
                    </CardTitle>
                    <CardDescription>
                        Tutti gli appuntamenti passati e futuri con questo cliente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {appointments.map((apt) => (
                            <div
                                key={apt.id}
                                className="flex items-center justify-between p-4 rounded-lg border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 transition-colors group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 font-medium text-sm shrink-0 shadow-sm">
                                        {format(new Date(apt.startTime), "d", { locale: it })}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-zinc-900">
                                            {format(new Date(apt.startTime), "EEEE, d MMMM yyyy", { locale: it })}
                                        </h4>
                                        <div className="text-sm text-zinc-500 flex items-center gap-2 mt-1">
                                            <span>
                                                {format(new Date(apt.startTime), "HH:mm", { locale: it })} - {format(new Date(apt.endTime), "HH:mm", { locale: it })}
                                            </span>
                                            <span className="text-zinc-300">•</span>
                                            <span>{apt.serviceType}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end gap-1">
                                        {getStatusBadge(apt.status)}
                                        {apt.price && (
                                            <span className="text-sm font-medium text-zinc-900">
                                                € {Number(apt.price).toFixed(2)}
                                            </span>
                                        )}
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-600">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(apt)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Modifica
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <AppointmentSheet
                isOpen={isSheetOpen}
                onClose={handleSheetClose}
                initialData={selectedAppointment ? {
                    id: selectedAppointment.id,
                    start: new Date(selectedAppointment.startTime),
                    end: new Date(selectedAppointment.endTime),
                    customerId: selectedAppointment.customerId,
                    serviceType: selectedAppointment.serviceType,
                    price: selectedAppointment.price,
                    customerName: customerName
                } : null}
            />
        </>
    );
}
