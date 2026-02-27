"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    createCheckoutSession,
    createBillingPortalSession,
} from "@/actions/stripe";
import { Loader2, CreditCard, ExternalLink } from "lucide-react";

interface BillingButtonsProps {
    status: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED";
    currentPlan: "STANDARD" | "PRO";
    standardPriceId: string;
    proPriceId: string;
}

export function BillingButtons({
    status,
    currentPlan,
    standardPriceId,
    proPriceId,
}: BillingButtonsProps) {
    const [isPending, startTransition] = useTransition();

    const handleCheckout = (priceId: string) => {
        startTransition(async () => {
            try {
                const { url } = await createCheckoutSession(priceId);
                window.location.href = url;
            } catch (error) {
                console.error("Checkout error:", error);
            }
        });
    };

    const handlePortal = () => {
        startTransition(async () => {
            try {
                const { url } = await createBillingPortalSession();
                window.location.href = url;
            } catch (error) {
                console.error("Portal error:", error);
            }
        });
    };

    // Se ACTIVE → solo "Gestisci Abbonamento"
    if (status === "ACTIVE") {
        return (
            <div className="pt-6 border-t">
                <Button
                    onClick={handlePortal}
                    disabled={isPending}
                    variant="outline"
                    size="lg"
                    className="w-full"
                >
                    {isPending ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <ExternalLink />
                    )}
                    {isPending
                        ? "Reindirizzamento..."
                        : "Gestisci Abbonamento / Scarica Fatture"}
                </Button>
            </div>
        );
    }

    // TRIAL, PAST_DUE, CANCELLED → mostra le due card pricing
    const plans = [
        {
            name: "Standard",
            price: "79,99",
            priceId: standardPriceId,
            planKey: "STANDARD" as const,
            features: [
                "Gestione clienti illimitati",
                "Calendario appuntamenti",
                "Inbox WhatsApp",
                "Gestione team",
                "Promemoria automatici",
                "Report e analytics",
            ],
            highlighted: false,
        },
        {
            name: "Pro",
            price: "140",
            priceId: proPriceId,
            planKey: "PRO" as const,
            badge: "Con IA",
            features: [
                "Tutto di Standard, più:",
                "Assistente IA integrato",
                "Risposte automatiche intelligenti",
                "Analisi predittiva clienti",
                "Automazioni avanzate",
                "Supporto prioritario",
            ],
            highlighted: true,
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => {
                const isCurrentPlan = false; // Questo blocco si raggiunge solo se NON active

                return (
                    <div
                        key={plan.name}
                        className={`relative rounded-xl border-2 p-6 flex flex-col transition-all ${plan.highlighted
                            ? "border-primary bg-primary/[0.02] shadow-lg shadow-primary/10"
                            : "border-zinc-200 bg-white"
                            }`}
                    >
                        {/* Badge "Con IA" */}
                        {plan.badge && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                                    ✨ {plan.badge}
                                </span>
                            </div>
                        )}

                        {/* Nome piano */}
                        <h3 className="text-lg font-semibold text-zinc-900">
                            {plan.name}
                        </h3>

                        {/* Prezzo */}
                        <div className="mt-3 flex items-baseline gap-1">
                            <span className="text-4xl font-bold tracking-tight text-zinc-900">
                                €{plan.price}
                            </span>
                            <span className="text-sm text-zinc-500">
                                /mese
                            </span>
                        </div>

                        {/* Features */}
                        <ul className="mt-6 space-y-3 flex-1">
                            {plan.features.map((feature) => (
                                <li
                                    key={feature}
                                    className="flex items-start gap-2 text-sm text-zinc-600"
                                >
                                    <svg
                                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${plan.highlighted
                                            ? "text-primary"
                                            : "text-emerald-500"
                                            }`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        {/* Bottone */}
                        <Button
                            onClick={() => handleCheckout(plan.priceId)}
                            disabled={isPending || isCurrentPlan}
                            variant={
                                plan.highlighted ? "default" : "outline"
                            }
                            size="lg"
                            className="mt-6 w-full"
                        >
                            {isPending ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <CreditCard />
                            )}
                            {isPending
                                ? "Reindirizzamento..."
                                : isCurrentPlan
                                    ? "Piano attuale"
                                    : `Attiva ${plan.name}`}
                        </Button>
                    </div>
                );
            })}
        </div>
    );
}
