"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

import { createAppointment } from "@/actions/calendar";
import { getCustomers } from "@/actions/customers";

const appointmentSchema = z.object({
    customerId: z.string().min(1, "Seleziona un cliente"),
    serviceType: z.string().min(3, "Inserisci almeno 3 caratteri"),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Data inizio non valida",
    }),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Data fine non valida",
    }),
    price: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentSheetProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: {
        start: Date;
        end: Date;
    } | null;
}

export function AppointmentSheet({
    isOpen,
    onClose,
    initialData,
}: AppointmentSheetProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [customers, setCustomers] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);

    const form = useForm<AppointmentFormValues>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            customerId: "",
            serviceType: "",
            startTime: "",
            endTime: "",
            price: "",
        },
    });

    // ... (useEffect hooks remain the same, ensuring price reset to "")

    function onSubmit(data: AppointmentFormValues) {
        startTransition(async () => {
            try {
                const payload = {
                    ...data,
                    price: data.price ? parseFloat(data.price) : undefined,
                };

                const result = await createAppointment(payload);

                if (result.success) {
                    toast({
                        title: "Appuntamento creato",
                        description: "L'appuntamento è stato salvato con successo.",
                    });
                    onClose();
                } else {
                    toast({
                        variant: "destructive",
                        title: "Errore",
                        description: result.error || "Qualcosa è andato storto.",
                    });
                }
            } catch (error) {
                console.error(error);
                toast({
                    variant: "destructive",
                    title: "Errore",
                    description: "Errore imprevisto durante il salvataggio.",
                });
            }
        });
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="overflow-y-auto sm:max-w-[425px]">
                <SheetHeader>
                    <SheetTitle>Nuovo Appuntamento</SheetTitle>
                    <SheetDescription>
                        Inserisci i dettagli per il nuovo appuntamento. Clicca salva per confermare.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">

                        {/* Cliente (Select Nativa style shadcn) */}
                        <FormField
                            control={form.control}
                            name="customerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cliente</FormLabel>
                                    <FormControl>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            {...field}
                                            disabled={loadingCustomers || isPending}
                                        >
                                            <option value="">Seleziona un cliente...</option>
                                            {customers.map((customer) => (
                                                <option key={customer.id} value={customer.id}>
                                                    {customer.firstName} {customer.lastName}
                                                </option>
                                            ))}
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Tipo Servizio */}
                        <FormField
                            control={form.control}
                            name="serviceType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Servizio</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Es. Taglio Capelli" {...field} disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            {/* Inizio */}
                            <FormField
                                control={form.control}
                                name="startTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Inizio</FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" {...field} disabled={isPending} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Fine */}
                            <FormField
                                control={form.control}
                                name="endTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fine</FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" {...field} disabled={isPending} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Prezzo */}
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Prezzo (€)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="0.00" {...field} disabled={isPending} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salva
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
