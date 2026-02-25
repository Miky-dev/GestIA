"use client";

import { useTransition, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, UserPlus, Shield, UserCog, Stethoscope, Clock } from "lucide-react";

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
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { createEmployee, updateEmployee } from "@/actions/employees";
import type { WorkScheduleItem } from "@/lib/schemas";

// ==========================================
// TIPI
// ==========================================

export interface Employee {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "SECRETARY" | "EMPLOYEE";
    isActive: boolean;
    specialty: string | null;
    createdAt: Date;
    workSchedules?: { dayOfWeek: number; startTime: string; endTime: string }[];
}

interface EmployeeSheetProps {
    isOpen: boolean;
    onClose: () => void;
    employeeToEdit?: Employee | null;
}

// ==========================================
// SCHEMA ZOD — condizionale su creazione/modifica
// ==========================================

const baseSchema = z.object({
    name: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
    email: z.string().email("Inserisci un'email valida"),
    role: z.enum(["ADMIN", "SECRETARY", "EMPLOYEE"]),
    password: z
        .string()
        .optional()
        .refine((val) => !val || val.length >= 6, {
            message: "La password deve avere almeno 6 caratteri",
        }),
    specialty: z.string().optional(),
});

// In creazione forziamo password obbligatoria (min 6)
const createSchema = baseSchema.extend({
    password: z
        .string()
        .min(6, "La password deve avere almeno 6 caratteri"),
});

type EmployeeFormValues = z.infer<typeof baseSchema>;

// ==========================================
// COSTANTI GIORNI
// ==========================================

const DAYS_OF_WEEK = [
    { value: 1, label: "Lunedì", short: "Lun" },
    { value: 2, label: "Martedì", short: "Mar" },
    { value: 3, label: "Mercoledì", short: "Mer" },
    { value: 4, label: "Giovedì", short: "Gio" },
    { value: 5, label: "Venerdì", short: "Ven" },
    { value: 6, label: "Sabato", short: "Sab" },
    { value: 0, label: "Domenica", short: "Dom" },
];

const DEFAULT_SCHEDULE: ScheduleDay[] = DAYS_OF_WEEK.map((day) => ({
    dayOfWeek: day.value,
    enabled: day.value >= 1 && day.value <= 5, // Lun-Ven attivi di default
    startTime: "09:00",
    endTime: "18:00",
}));

interface ScheduleDay {
    dayOfWeek: number;
    enabled: boolean;
    startTime: string;
    endTime: string;
}

// ==========================================
// LABEL RUOLO
// ==========================================

const roleConfig: Record<"ADMIN" | "SECRETARY" | "EMPLOYEE", { label: string; description: string; icon: React.ReactNode }> = {
    ADMIN: {
        label: "Admin",
        description: "Accesso completo al sistema",
        icon: <Shield className="h-4 w-4 text-violet-500" />,
    },
    SECRETARY: {
        label: "Segreteria",
        description: "Gestione clienti e appuntamenti",
        icon: <UserCog className="h-4 w-4 text-blue-500" />,
    },
    EMPLOYEE: {
        label: "Dipendente",
        description: "Operatore con specialità",
        icon: <Stethoscope className="h-4 w-4 text-emerald-500" />,
    },
};

// ==========================================
// COMPONENTE
// ==========================================

export function EmployeeSheet({ isOpen, onClose, employeeToEdit }: EmployeeSheetProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [schedule, setSchedule] = useState<ScheduleDay[]>(DEFAULT_SCHEDULE);

    const isEditMode = !!employeeToEdit;

    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(isEditMode ? baseSchema : createSchema),
        defaultValues: {
            name: "",
            email: "",
            role: "SECRETARY",
            password: "",
            specialty: "",
        },
    });

    // Precompila form in modalità modifica / resetta in creazione
    useEffect(() => {
        if (employeeToEdit) {
            form.reset({
                name: employeeToEdit.name,
                email: employeeToEdit.email,
                role: employeeToEdit.role,
                password: "",
                specialty: employeeToEdit.specialty || "",
            });

            // Ripristina orari dal DB
            if (employeeToEdit.workSchedules && employeeToEdit.workSchedules.length > 0) {
                const dbScheduleMap = new Map(
                    employeeToEdit.workSchedules.map((ws) => [ws.dayOfWeek, ws])
                );
                setSchedule(
                    DAYS_OF_WEEK.map((day) => {
                        const ws = dbScheduleMap.get(day.value);
                        return {
                            dayOfWeek: day.value,
                            enabled: !!ws,
                            startTime: ws?.startTime || "09:00",
                            endTime: ws?.endTime || "18:00",
                        };
                    })
                );
            } else {
                setSchedule(DEFAULT_SCHEDULE);
            }
        } else {
            form.reset({
                name: "",
                email: "",
                role: "SECRETARY",
                password: "",
                specialty: "",
            });
            setSchedule(DEFAULT_SCHEDULE);
        }
    }, [employeeToEdit, form]);

    // Reset form alla chiusura
    function handleOpenChange(open: boolean) {
        if (!open) {
            form.reset();
            setSchedule(DEFAULT_SCHEDULE);
            onClose();
        }
    }

    function updateScheduleDay(dayOfWeek: number, updates: Partial<ScheduleDay>) {
        setSchedule((prev) =>
            prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...updates } : d))
        );
    }

    function buildWorkSchedules(): WorkScheduleItem[] {
        return schedule
            .filter((d) => d.enabled)
            .map((d) => ({
                dayOfWeek: d.dayOfWeek,
                startTime: d.startTime,
                endTime: d.endTime,
            }));
    }

    async function onSubmit(data: EmployeeFormValues) {
        startTransition(async () => {
            try {
                const workSchedules = buildWorkSchedules();

                if (isEditMode && employeeToEdit) {
                    const result = await updateEmployee(employeeToEdit.id, {
                        name: data.name,
                        role: data.role as "ADMIN" | "SECRETARY" | "EMPLOYEE",
                        password: data.password || undefined,
                        specialty: data.role === "EMPLOYEE" ? (data.specialty || undefined) : null,
                        workSchedules,
                    });

                    if (!result.success) {
                        toast({
                            title: "Errore aggiornamento",
                            description: result.error ?? "Si è verificato un problema.",
                            variant: "destructive",
                        });
                        return;
                    }

                    toast({
                        title: "Dipendente aggiornato",
                        description: `${data.name} è stato aggiornato correttamente.`,
                    });
                } else {
                    const result = await createEmployee({
                        name: data.name,
                        email: data.email,
                        role: data.role as "ADMIN" | "SECRETARY" | "EMPLOYEE",
                        password: data.password!,
                        specialty: data.role === "EMPLOYEE" ? (data.specialty || undefined) : undefined,
                        workSchedules,
                    });

                    if (!result.success) {
                        // Errore email duplicata (messaggio specifico dal server)
                        if (result.error?.includes("esiste già")) {
                            toast({
                                title: "Email già in uso",
                                description: "Un dipendente con questa email esiste già in azienda.",
                                variant: "destructive",
                            });
                        } else {
                            toast({
                                title: "Errore creazione",
                                description: result.error ?? "Si è verificato un problema.",
                                variant: "destructive",
                            });
                        }
                        return;
                    }

                    toast({
                        title: "Dipendente aggiunto",
                        description: `${data.name} è stato aggiunto al team.`,
                    });
                }

                handleOpenChange(false);
            } catch {
                toast({
                    title: "Errore inaspettato",
                    description: "Si è verificato un problema. Riprova più tardi.",
                    variant: "destructive",
                });
            }
        });
    }

    const showSchedule = form.watch("role") !== "ADMIN";

    return (
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                {/* Header */}
                <SheetHeader className="pb-6 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
                            <UserPlus className="h-5 w-5 text-zinc-600" />
                        </div>
                        <div>
                            <SheetTitle className="text-lg font-semibold text-zinc-900">
                                {isEditMode ? "Modifica Dipendente" : "Nuovo Dipendente"}
                            </SheetTitle>
                            <SheetDescription className="text-sm text-zinc-500 mt-0.5">
                                {isEditMode
                                    ? "Aggiorna i dati del dipendente. L'email non può essere modificata."
                                    : "Aggiungi un nuovo membro al tuo team."}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                {/* Form */}
                <div className="mt-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            {/* Nome */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-zinc-700 font-medium">
                                            Nome completo
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="es. Marco Rossi"
                                                className="h-10"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Email — disabilitata in modifica */}
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-zinc-700 font-medium">
                                            Email
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="marco.rossi@azienda.it"
                                                className="h-10"
                                                disabled={isEditMode}
                                                {...field}
                                            />
                                        </FormControl>
                                        {isEditMode && (
                                            <FormDescription className="text-xs text-zinc-400">
                                                L&apos;indirizzo email non può essere modificato.
                                            </FormDescription>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Ruolo */}
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-zinc-700 font-medium">
                                            Ruolo
                                        </FormLabel>
                                        <FormControl>
                                            <div className="grid grid-cols-3 gap-3">
                                                {(["ADMIN", "SECRETARY", "EMPLOYEE"] as const).map((role) => {
                                                    const config = roleConfig[role];
                                                    const isSelected = field.value === role;
                                                    return (
                                                        <button
                                                            key={role}
                                                            type="button"
                                                            onClick={() => field.onChange(role)}
                                                            className={`
                                                                flex flex-col items-start gap-1.5 rounded-lg border p-3.5 text-left
                                                                transition-all duration-150 cursor-pointer
                                                                ${isSelected
                                                                    ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
                                                                    : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                                                                }
                                                            `}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {config.icon}
                                                                <span className={`text-sm font-medium ${isSelected ? "text-zinc-900" : "text-zinc-600"}`}>
                                                                    {config.label}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs text-zinc-400 leading-tight">
                                                                {config.description}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Specialità — visibile solo quando ruolo è EMPLOYEE */}
                            {form.watch("role") === "EMPLOYEE" && (
                                <FormField
                                    control={form.control}
                                    name="specialty"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-zinc-700 font-medium">
                                                Specialità
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="es. Medico, Dentista, Estetista"
                                                    className="h-10"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs text-zinc-400">
                                                La professione o il ruolo operativo del dipendente.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* ==========================================
                                ORARI DI LAVORO
                            ========================================== */}
                            {showSchedule && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-zinc-500" />
                                        <Label className="text-zinc-700 font-medium text-sm">
                                            Orari di Lavoro
                                        </Label>
                                    </div>
                                    <div className="rounded-lg border border-zinc-200 divide-y divide-zinc-100 bg-white">
                                        {DAYS_OF_WEEK.map((day) => {
                                            const scheduleDay = schedule.find(
                                                (s) => s.dayOfWeek === day.value
                                            )!;

                                            return (
                                                <div
                                                    key={day.value}
                                                    className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${scheduleDay.enabled
                                                            ? "bg-white"
                                                            : "bg-zinc-50/50"
                                                        }`}
                                                >
                                                    <Switch
                                                        checked={scheduleDay.enabled}
                                                        onCheckedChange={(checked) =>
                                                            updateScheduleDay(day.value, { enabled: checked })
                                                        }
                                                    />
                                                    <span
                                                        className={`text-sm w-12 font-medium ${scheduleDay.enabled
                                                                ? "text-zinc-700"
                                                                : "text-zinc-400"
                                                            }`}
                                                    >
                                                        {day.short}
                                                    </span>

                                                    {scheduleDay.enabled ? (
                                                        <div className="flex items-center gap-2 ml-auto">
                                                            <Input
                                                                type="time"
                                                                className="h-8 w-[100px] text-sm"
                                                                value={scheduleDay.startTime}
                                                                onChange={(e) =>
                                                                    updateScheduleDay(day.value, {
                                                                        startTime: e.target.value,
                                                                    })
                                                                }
                                                            />
                                                            <span className="text-zinc-400 text-xs">—</span>
                                                            <Input
                                                                type="time"
                                                                className="h-8 w-[100px] text-sm"
                                                                value={scheduleDay.endTime}
                                                                onChange={(e) =>
                                                                    updateScheduleDay(day.value, {
                                                                        endTime: e.target.value,
                                                                    })
                                                                }
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span className="ml-auto text-xs text-zinc-400">
                                                            Giorno libero
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Password — obbligatoria in creazione, opzionale in modifica */}
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-zinc-700 font-medium">
                                            Password
                                            {isEditMode && (
                                                <span className="ml-1.5 text-xs font-normal text-zinc-400">
                                                    (opzionale)
                                                </span>
                                            )}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder={
                                                    isEditMode
                                                        ? "Lascia vuoto per non modificarla"
                                                        : "Min. 6 caratteri"
                                                }
                                                className="h-10"
                                                {...field}
                                            />
                                        </FormControl>
                                        {isEditMode && (
                                            <FormDescription className="text-xs text-zinc-400">
                                                Compila solo se vuoi aggiornare la password.
                                            </FormDescription>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Azioni */}
                            <div className="pt-4 flex justify-end gap-2 border-t border-zinc-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleOpenChange(false)}
                                    disabled={isPending}
                                    className="h-10"
                                >
                                    Annulla
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="h-10 min-w-[130px]"
                                >
                                    {isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {isEditMode ? "Salva Modifiche" : "Aggiungi Dipendente"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
