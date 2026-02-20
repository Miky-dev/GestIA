"use client";

import { useState, useTransition } from "react";
import { MailWarning, X, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { resendVerificationEmail } from "@/actions/verify-email";
import { Button } from "@/components/ui/button";

type ResendState = "idle" | "loading" | "sent" | "rate_limited" | "error";

export function EmailVerificationBanner() {
    const [dismissed, setDismissed] = useState(false);
    const [resendState, setResendState] = useState<ResendState>("idle");
    const [isPending, startTransition] = useTransition();

    if (dismissed) return null;

    const handleResend = () => {
        startTransition(async () => {
            setResendState("loading");
            const result = await resendVerificationEmail();

            if (result.success) {
                setResendState("sent");
            } else if (result.error === "RATE_LIMITED") {
                setResendState("rate_limited");
            } else {
                setResendState("error");
            }
        });
    };

    return (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-3">
            {/* Icon */}
            <MailWarning className="w-4 h-4 text-amber-600 flex-shrink-0" />

            {/* Message */}
            <p className="flex-1 text-sm text-amber-800">
                <span className="font-semibold">Verifica la tua email</span>
                {" "}— Alcune funzionalità sono limitate finché non confermi il tuo indirizzo.
            </p>

            {/* Feedback inline */}
            {resendState === "sent" && (
                <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Email inviata!
                </span>
            )}
            {resendState === "rate_limited" && (
                <span className="flex items-center gap-1 text-xs text-amber-700 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Link già attivo — controlla la casella email.
                </span>
            )}
            {resendState === "error" && (
                <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Errore. Riprova più tardi.
                </span>
            )}

            {/* Resend button — hidden after success/rate-limited */}
            {(resendState === "idle" || resendState === "error") && (
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-amber-300 text-amber-800 hover:bg-amber-100 hover:border-amber-400 gap-1.5"
                    onClick={handleResend}
                    disabled={isPending}
                >
                    {isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <Send className="w-3 h-3" />
                    )}
                    Re-invia email
                </Button>
            )}

            {/* Dismiss */}
            <button
                onClick={() => setDismissed(true)}
                title="Chiudi (riappare al prossimo reload)"
                className="p-0.5 rounded text-amber-500 hover:text-amber-700 hover:bg-amber-100 transition-colors"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
