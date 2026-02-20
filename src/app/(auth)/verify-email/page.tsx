"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

import { verifyEmail } from "@/actions/verify-email";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

type VerifyState = "loading" | "success" | "invalid" | "expired" | "already" | "error";

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [state, setState] = useState<VerifyState>("loading");

    useEffect(() => {
        if (!token) {
            setState("invalid");
            return;
        }

        verifyEmail(token).then((result) => {
            if (result.success) {
                setState("success");
            } else {
                switch (result.error) {
                    case "EXPIRED_TOKEN": setState("expired"); break;
                    case "ALREADY_VERIFIED": setState("already"); break;
                    case "INVALID_TOKEN": setState("invalid"); break;
                    default: setState("error"); break;
                }
            }
        });
    }, [token]);

    const states: Record<VerifyState, {
        icon: React.ReactNode;
        title: string;
        description: string;
        cta?: React.ReactNode;
    }> = {
        loading: {
            icon: <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />,
            title: "Verifica in corso...",
            description: "Attendi mentre verifichiamo il tuo link.",
        },
        success: {
            icon: <CheckCircle2 className="h-10 w-10 text-emerald-500" />,
            title: "Email verificata!",
            description: "Il tuo account è ora attivo. Puoi accedere al dashboard.",
            cta: (
                <Button asChild className="w-full bg-zinc-900 hover:bg-zinc-700 text-white">
                    <Link href="/dashboard">Vai al Dashboard</Link>
                </Button>
            ),
        },
        invalid: {
            icon: <XCircle className="h-10 w-10 text-red-500" />,
            title: "Link non valido",
            description: "Il link di verifica non è corretto o è stato già usato.",
            cta: (
                <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard">Torna al Dashboard</Link>
                </Button>
            ),
        },
        expired: {
            icon: <AlertCircle className="h-10 w-10 text-amber-500" />,
            title: "Link scaduto",
            description: "Il link è scaduto (validità 24h). Richiedi un nuovo link dalla sezione impostazioni.",
            cta: (
                <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard">Torna al Dashboard</Link>
                </Button>
            ),
        },
        already: {
            icon: <CheckCircle2 className="h-10 w-10 text-emerald-500" />,
            title: "Già verificata",
            description: "La tua email è già stata verificata in precedenza.",
            cta: (
                <Button asChild className="w-full bg-zinc-900 hover:bg-zinc-700 text-white">
                    <Link href="/dashboard">Vai al Dashboard</Link>
                </Button>
            ),
        },
        error: {
            icon: <XCircle className="h-10 w-10 text-red-500" />,
            title: "Errore del server",
            description: "Si è verificato un errore imprevisto. Riprova più tardi.",
            cta: (
                <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard">Torna al Dashboard</Link>
                </Button>
            ),
        },
    };

    const current = states[state];

    return (
        <div className="w-full max-w-sm space-y-6">
            {/* Logo */}
            <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">G</span>
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-zinc-900">GestIA</h1>
            </div>

            <Card className="shadow-sm border-zinc-200">
                <CardHeader className="pb-2 items-center text-center">
                    <div className="mb-3">{current.icon}</div>
                    <CardTitle className="text-lg font-semibold">{current.title}</CardTitle>
                    <CardDescription className="text-sm text-zinc-500 text-center">
                        {current.description}
                    </CardDescription>
                </CardHeader>
                <CardContent />
                {current.cta && (
                    <CardFooter>
                        {current.cta}
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
