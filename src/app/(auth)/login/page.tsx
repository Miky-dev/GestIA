"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { loginUser } from "@/actions/auth";
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
import { AlertCircle, Loader2 } from "lucide-react";

// Schema di validazione Zod
const loginSchema = z.object({
    email: z.string().email("Inserisci un indirizzo email valido"),
    password: z.string().min(6, "La password deve contenere almeno 6 caratteri"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    function onSubmit(data: LoginFormValues) {
        setServerError(null);

        startTransition(async () => {
            const result = await loginUser(data);

            if (!result.success) {
                setServerError(result.error);
                return;
            }

            router.push("/dashboard");
            router.refresh();
        });
    }

    return (
        <div className="w-full max-w-sm space-y-6">
            {/* Logo placeholder */}
            <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">G</span>
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
                    GestIA
                </h1>
                <p className="text-sm text-zinc-500">Il tuo gestionale intelligente</p>
            </div>

            <Card className="shadow-sm border-zinc-200">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold">Accedi</CardTitle>
                    <CardDescription className="text-zinc-500 text-sm">
                        Inserisci le tue credenziali per continuare
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        {/* Errore dal server */}
                        {serverError && (
                            <Alert variant="destructive" className="py-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-sm">
                                    {serverError}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Email */}
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-sm font-medium">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nome@azienda.com"
                                autoComplete="email"
                                className="h-9"
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
                                placeholder="••••••••"
                                autoComplete="current-password"
                                className="h-9"
                                {...register("password")}
                            />
                            {errors.password && (
                                <p className="text-xs text-red-500">
                                    {errors.password.message}
                                </p>
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
                                    Accesso in corso...
                                </>
                            ) : (
                                "Accedi"
                            )}
                        </Button>

                        <button
                            type="button"
                            className="text-xs text-zinc-500 hover:text-zinc-700 hover:underline transition-colors"
                        >
                            Hai dimenticato la password?
                        </button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
