"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Importa le server actions
import { createCustomer, updateCustomer } from "@/actions/customers";

// Schema di validazione
const customerSchema = z.object({
    firstName: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
    lastName: z.string().min(2, "Il cognome deve avere almeno 2 caratteri"),
    phone: z
        .string()
        .min(5, "Inserisci un numero di telefono valido")
        .regex(/^(\+)?[0-9\s]+$/, "Il numero può contenere solo cifre e spazi"),
    email: z.string().email("Email non valida").optional().or(z.literal("")),
    internalNotes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

// Tipi per le props del componente
// customerToEdit è opzionale: se presente, siamo in modalità edit
interface CustomerSheetProps {
    customerToEdit?: {
        id: string;
        firstName: string;
        lastName: string;
        phoneE164: string;
        email?: string | null;
        internalNotes?: string | null;
    } | null;
    trigger?: React.ReactNode; // Elemento che apre lo sheet
    onClose?: () => void; // Callback opzionale alla chiusura
    open?: boolean; // Controllo manuale apertura
    onOpenChange?: (open: boolean) => void;
}

export function CustomerSheet({
    customerToEdit,
    trigger,
    onClose,
    open: controlledOpen,
    onOpenChange: controlledOpenChange,
}: CustomerSheetProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    // Gestione stato open controllato o interno
    const isOpen = controlledOpen ?? internalOpen;
    const onOpenChange = (newOpen: boolean) => {
        if (controlledOpenChange) {
            controlledOpenChange(newOpen);
        } else {
            setInternalOpen(newOpen);
        }
        if (!newOpen && onClose) onClose();
    };

    const isEditMode = !!customerToEdit;

    // Setup del form
    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            firstName: customerToEdit?.firstName || "",
            lastName: customerToEdit?.lastName || "",
            // Se modifico, uso phoneE164, altrimenti stringa vuota
            phone: customerToEdit?.phoneE164 || "",
            email: customerToEdit?.email || "",
            internalNotes: customerToEdit?.internalNotes || "",
        },
    });

    // Reset del form quando cambia customerToEdit o si apre lo sheet
    // (Nota: per semplicità React Hook Form gestisce il reset con useEffect interno se cambiano defaultValues, 
    // ma qui lo forziamo se serve. Per ora defaultValues basta alla mount o key change).

    async function onSubmit(data: CustomerFormValues) {
        startTransition(async () => {
            try {
                if (isEditMode && customerToEdit) {
                    await updateCustomer(customerToEdit.id, data);
                    toast({
                        title: "Cliente aggiornato",
                        description: `${data.firstName} ${data.lastName} è stato aggiornato correttamente.`,
                    });
                } else {
                    await createCustomer(data);
                    toast({
                        title: "Cliente creato",
                        description: `${data.firstName} ${data.lastName} è stato aggiunto alla lista.`,
                    });
                }

                // Chiudi lo sheet e resetta il form
                onOpenChange(false);
                form.reset();
            } catch (error) {
                toast({
                    title: "Errore",
                    description: "Si è verificato un problema. Riprova più tardi.",
                    variant: "destructive",
                });
            }
        });
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            {/* Se c'è un trigger custom lo usiamo.
          Se non c'è trigger custom E non siamo in modalità controllata enternamente, mostriamo il trigger di default.
      */}
            {trigger ? (
                <SheetTrigger asChild>{trigger}</SheetTrigger>
            ) : (
                controlledOpen === undefined && (
                    <SheetTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nuovo Cliente
                        </Button>
                    </SheetTrigger>
                )
            )}

            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{isEditMode ? "Modifica Cliente" : "Nuovo Cliente"}</SheetTitle>
                    <SheetDescription>
                        {isEditMode
                            ? "Modifica i dati del cliente qui sotto. Clicca salva quando hai finito."
                            : "Aggiungi un nuovo cliente alla tua lista anagrafica."}
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-8 space-y-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Nome */}
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Mario" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Cognome */}
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cognome</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Rossi" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Telefono */}
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telefono</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+39 333 1234567" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Email */}
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email (opzionale)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="mario.rossi@email.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Note Interne */}
                            <FormField
                                control={form.control}
                                name="internalNotes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Note Interne</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Informazioni aggiuntive..."
                                                className="resize-none min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="pt-4 flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={isPending}
                                >
                                    Annulla
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isEditMode ? "Salva Modifiche" : "Crea Cliente"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
