import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BillingButtons } from "@/components/settings/BillingButtons";
import { Sparkles, CalendarDays, CreditCard, AlertTriangle } from "lucide-react";

// Mappa status → configurazione badge
const statusConfig: Record<
    string,
    { label: string; className: string }
> = {
    ACTIVE: {
        label: "Attivo",
        className:
            "bg-emerald-500/15 text-emerald-700 border-emerald-500/25 hover:bg-emerald-500/15",
    },
    TRIAL: {
        label: "Prova gratuita",
        className:
            "bg-amber-500/15 text-amber-700 border-amber-500/25 hover:bg-amber-500/15",
    },
    PAST_DUE: {
        label: "Pagamento in sospeso",
        className:
            "bg-amber-500/15 text-amber-700 border-amber-500/25 hover:bg-amber-500/15",
    },
    CANCELLED: {
        label: "Cancellato",
        className:
            "bg-red-500/15 text-red-700 border-red-500/25 hover:bg-red-500/15",
    },
};

const planLabels: Record<string, string> = {
    STANDARD: "Standard",
    PRO: "Pro (con IA)",
};

export default async function BillingPage() {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.companyId) {
        redirect("/auth/login");
    }

    // Solo ADMIN può accedere al billing
    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <div className="bg-red-50 text-red-600 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                    Accesso negato
                </h1>
                <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                    Solo i titolari (ADMIN) possono accedere alla
                    gestione dell&apos;abbonamento.
                </p>
            </div>
        );
    }

    // Recupera i dati billing della company
    const company = await prisma.company.findUnique({
        where: { id: session.user.companyId },
        select: {
            subscriptionPlan: true,
            subscriptionStatus: true,
            stripeCurrentPeriodEnd: true,
            stripeCustomerId: true,
            createdAt: true,
        },
    });

    if (!company) {
        redirect("/auth/login");
    }

    const { subscriptionPlan, subscriptionStatus, stripeCurrentPeriodEnd, createdAt } =
        company;
    const status = statusConfig[subscriptionStatus] ?? statusConfig.TRIAL;
    const planLabel = planLabels[subscriptionPlan] ?? subscriptionPlan;

    // Calcola giorni rimanenti del trial (14 giorni dalla creazione)
    const trialEndDate = new Date(createdAt);
    trialEndDate.setDate(trialEndDate.getDate() + 14);
    const now = new Date();
    const trialDaysLeft = Math.max(
        0,
        Math.ceil(
            (trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
    );

    // Price IDs dei piani
    const standardPriceId = process.env.STRIPE_STANDARD_PRICE_ID ?? "";
    const proPriceId = process.env.STRIPE_PRO_PRICE_ID ?? "";

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">
                    Abbonamento e Fatturazione
                </h2>
                <p className="text-muted-foreground mt-1">
                    Gestisci il tuo piano, i metodi di pagamento e
                    scarica le fatture.
                </p>
            </div>

            <div className="space-y-6">
                {/* Card stato attuale */}
                <Card className="max-w-2xl">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">
                                        Il tuo piano attuale
                                    </CardTitle>
                                    <CardDescription>
                                        Dettagli del tuo abbonamento GestIA
                                    </CardDescription>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className={status.className}
                            >
                                {status.label}
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Nome Piano */}
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">
                                        Piano
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {planLabel}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Trial info */}
                        {subscriptionStatus === "TRIAL" && (
                            <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                                <div className="flex items-center gap-3">
                                    <CalendarDays className="h-5 w-5 text-amber-600" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-900">
                                            Prova gratuita
                                        </p>
                                        <p className="text-sm text-amber-700">
                                            {trialDaysLeft > 0
                                                ? `${trialDaysLeft} giorni rimanenti — scade il ${format(trialEndDate, "d MMMM yyyy", { locale: it })}`
                                                : "Prova gratuita scaduta"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Data prossimo rinnovo (solo se abbonamento attivo) */}
                        {stripeCurrentPeriodEnd &&
                            subscriptionStatus !== "TRIAL" && (
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="flex items-center gap-3">
                                        <CalendarDays className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                {subscriptionStatus ===
                                                    "CANCELLED"
                                                    ? "Accesso fino al"
                                                    : "Prossimo rinnovo"}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(
                                                    stripeCurrentPeriodEnd,
                                                    "d MMMM yyyy",
                                                    { locale: it }
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                    </CardContent>
                </Card>

                {/* Pricing cards o gestione abbonamento */}
                <div>
                    {subscriptionStatus !== "ACTIVE" && (
                        <h3 className="text-xl font-semibold tracking-tight mb-4">
                            Scegli il tuo piano
                        </h3>
                    )}
                    <BillingButtons
                        status={subscriptionStatus}
                        currentPlan={subscriptionPlan}
                        standardPriceId={standardPriceId}
                        proPriceId={proPriceId}
                    />
                </div>
            </div>
        </div>
    );
}
