"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Trash2 } from "lucide-react";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

import { createAppointment, updateAppointment, deleteAppointment } from "@/actions/calendar";
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
        id?: string;
        start: Date;
        end: Date;
        customerId?: string;
        serviceType?: string;
        price?: number | null;
        customerName?: string; // Optional for display
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
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const isEditing = !!initialData?.id;

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

    // Carica i clienti all'apertura dello sheet
    useEffect(() => {
        if (isOpen) {
            const fetchCustomers = async () => {
                setLoadingCustomers(true);
                try {
                    const data = await getCustomers();
                    setCustomers(data);
                } catch (error) {
                    console.error("Errore caricamento clienti:", error);
                    toast({
                        variant: "destructive",
                        title: "Errore",
                        description: "Impossibile caricare la lista clienti.",
                    });
                } finally {
                    setLoadingCustomers(false);
                }
            };
            fetchCustomers();
        }
    }, [isOpen, toast]);

    // Imposta i valori iniziali quando cambia initialData o apre lo sheet
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Formatta le date per input datetime-local (YYYY-MM-DDTHH:mm)
                // Nota: toISOString() restituisce UTC. Per mantenere l'ora locale del browser, 
                // dobbiamo gestire il fuso orario o usare una libreria come date-fns.
                // Qui facciamo una conversione manuale semplice per evitare dipendenze extra se non presenti.
                const toLocalISO = (date: Date) => {
                    const pad = (n: number) => n < 10 ? '0' + n : n;
                    return date.getFullYear() +
                        '-' + pad(date.getMonth() + 1) +
                        '-' + pad(date.getDate()) +
                        'T' + pad(date.getHours()) +
                        ':' + pad(date.getMinutes());
                };

                form.reset({
                    customerId: initialData.customerId || "",
                    serviceType: initialData.serviceType || "",
                    startTime: toLocalISO(initialData.start),
                    endTime: toLocalISO(initialData.end),
                    price: initialData.price ? initialData.price.toString() : "",
                });
            } else {
                form.reset({
                    customerId: "",
                    serviceType: "",
                    startTime: "",
                    endTime: "",
                    price: "",
                });
            }
        }
    }, [isOpen, initialData, form]);

    function onSubmit(data: AppointmentFormValues) {
        startTransition(async () => {
            try {
                const payload = {
                    ...data,
                    price: data.price ? parseFloat(data.price) : undefined,
                };

                let result;
                if (isEditing && initialData?.id) {
                    result = await updateAppointment(initialData.id, payload);
                } else {
                    result = await createAppointment(payload);
                }

                if (result.success) {
                    toast({
                        title: isEditing ? "Appuntamento aggiornato" : "Appuntamento creato",
                        description: "Le modifiche sono state salvate con successo.",
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

    const handleDelete = async () => {
        if (!initialData?.id) return;

        startTransition(async () => {
            try {
                const result = await deleteAppointment(initialData.id!);
                if (result.success) {
                    toast({
                        title: "Appuntamento eliminato",
                        description: "L'appuntamento è stato rimosso.",
                    });
                    setIsDeleteOpen(false);
                    onClose();
                } else {
                    toast({
                        variant: "destructive",
                        title: "Errore",
                        description: result.error || "Impossibile eliminare l'appuntamento.",
                    });
                }
            } catch (err) {
                console.error(err);
                toast({
                    variant: "destructive",
                    title: "Errore",
                    description: "Errore durante l'eliminazione.",
                });
            }
        });
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="overflow-y-auto sm:max-w-[425px]">
                <SheetHeader>
                    <SheetTitle>{isEditing ? "Modifica Appuntamento" : "Nuovo Appuntamento"}</SheetTitle>
                    <SheetDescription>
                        {isEditing ? "Modifica i dettagli o elimina l'appuntamento." : "Inserisci i dettagli per il nuovo appuntamento. Clicca salva per confermare."}
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">

                        {/* Cliente (Shadcn Select) */}
                        <FormField
                            control={form.control}
                            name="customerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cliente</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={loadingCustomers || isPending}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleziona un cliente..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {customers.map((customer) => (
                                                <SelectItem key={customer.id} value={customer.id}>
                                                    {customer.firstName} {customer.lastName}
                                                </SelectItem>
                                            ))}
                                            {customers.length === 0 && !loadingCustomers && (
                                                <div className="p-2 text-sm text-muted-foreground text-center">
                                                    Nessun cliente trovato
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
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

                        <div className="flex justify-between pt-4">
                            {isEditing && (
                                <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" type="button" disabled={isPending}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Elimina
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Questa azione non può essere annullata. L'appuntamento verrà eliminato definitivamente.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                Elimina
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            <Button type="submit" disabled={isPending} className={!isEditing ? "ml-auto" : ""}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Aggiorna" : "Salva"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
