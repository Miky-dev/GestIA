"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Building2 } from "lucide-react";

import { registerCompany } from "@/actions/register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ==========================================
// SCHEMA
// ==========================================

const registerSchema = z.object({
    companyName: z.string().min(2, "Il nome azienda deve avere almeno 2 caratteri"),
    adminName: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
    email: z.string().email("Inserisci un'email valida"),
    password: z.string().min(8, "La password deve avere almeno 8 caratteri"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// ==========================================
// PAGINA
// ==========================================

export default function RegisterPage() {
    const [isPending, startTransition] = useTransition();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    });

    function onSubmit(data: RegisterFormValues) {
        setServerError(null);

        startTransition(async () => {
            const result = await registerCompany(data);

            if (!result.success) {
                // Errori su singoli campi (es. email già in uso)
                if (result.fieldErrors) {
                    for (const [field, message] of Object.entries(result.fieldErrors)) {
                        setError(field as keyof RegisterFormValues, { message });
                    }
                }
                setServerError(result.error);
            }
            // Se successo: il redirect avviene nella server action
        });
    }

    return (
        <div className="w-full max-w-sm space-y-6">

            {/* Logo + Intestazione */}
            <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">G</span>
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
                    GestIA
                </h1>
                <p className="text-sm text-zinc-500">Crea il tuo account aziendale</p>
            </div>

            <Card className="shadow-sm border-zinc-200">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-zinc-400" />
                        Nuova Azienda
                    </CardTitle>
                    <CardDescription className="text-zinc-500 text-sm">
                        Registra la tua azienda e inizia subito.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">

                        {/* Errore server */}
                        {serverError && (
                            <Alert variant="destructive" className="py-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-sm">
                                    {serverError}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Nome Azienda */}
                        <div className="space-y-1.5">
                            <Label htmlFor="companyName" className="text-sm font-medium">
                                Nome Azienda
                            </Label>
                            <Input
                                id="companyName"
                                placeholder="es. Studio Rossi"
                                className="h-9"
                                disabled={isPending}
                                {...register("companyName")}
                            />
                            {errors.companyName && (
                                <p className="text-xs text-red-500">{errors.companyName.message}</p>
                            )}
                        </div>

                        {/* Nome Titolare */}
                        <div className="space-y-1.5">
                            <Label htmlFor="adminName" className="text-sm font-medium">
                                Nome Titolare
                            </Label>
                            <Input
                                id="adminName"
                                placeholder="es. Marco Rossi"
                                className="h-9"
                                disabled={isPending}
                                {...register("adminName")}
                            />
                            {errors.adminName && (
                                <p className="text-xs text-red-500">{errors.adminName.message}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-sm font-medium">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="marco@azienda.com"
                                autoComplete="email"
                                className="h-9"
                                disabled={isPending}
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="text-xs text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-sm font-medium">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Min. 8 caratteri"
                                autoComplete="new-password"
                                className="h-9"
                                disabled={isPending}
                                {...register("password")}
                            />
                            {errors.password && (
                                <p className="text-xs text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                    </CardContent>

                    <CardFooter className="flex flex-col gap-3 pt-2">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-9 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creazione in corso...
                                </>
                            ) : (
                                "Crea Azienda"
                            )}
                        </Button>

                        <p className="text-xs text-zinc-500 text-center">
                            Hai già un account?{" "}
                            <Link
                                href="/login"
                                className="text-zinc-700 font-medium hover:underline transition-colors"
                            >
                                Accedi
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
