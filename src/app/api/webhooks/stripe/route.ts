import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// Helper: estrai current_period_end dal primo item della subscription
function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): Date {
    const periodEnd = subscription.items.data[0]?.current_period_end;
    return new Date((periodEnd ?? 0) * 1000);
}

// Helper: estrai subscription ID dall'invoice (nuovo SDK: parent.subscription_details)
function getSubscriptionIdFromInvoice(
    invoice: Stripe.Invoice
): string | null {
    const sub = invoice.parent?.subscription_details?.subscription;
    if (!sub) return null;
    return typeof sub === "string" ? sub : sub.id;
}

/**
 * Stripe Webhook Handler
 *
 * Ascolta gli eventi di Stripe e aggiorna il database in tempo reale.
 * Verifica la firma per garantire che la richiesta provenga da Stripe.
 */
export async function POST(req: Request) {
    // 1. Lettura raw body e signature
    const body = await req.text();
    const signature = req.headers.get("Stripe-Signature");

    if (!signature) {
        return NextResponse.json(
            { error: "Missing Stripe-Signature header" },
            { status: 400 }
        );
    }

    // 2. Verifica la firma del webhook (sicurezza)
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "Unknown error";
        console.error(
            `❌ Webhook signature verification failed: ${message}`
        );
        return NextResponse.json(
            { error: `Webhook Error: ${message}` },
            { status: 400 }
        );
    }

    // 3. Gestione eventi
    try {
        switch (event.type) {
            // ────────────────────────────────────────────
            // CHECKOUT COMPLETATO → Attiva l'abbonamento
            // ────────────────────────────────────────────
            case "checkout.session.completed": {
                const session = event.data
                    .object as Stripe.Checkout.Session;

                // client_reference_id = companyId (impostato in createCheckoutSession)
                const companyId = session.client_reference_id;
                if (!companyId) {
                    console.error(
                        "❌ checkout.session.completed: missing client_reference_id"
                    );
                    break;
                }

                // Recupera la subscription da Stripe per ottenere i dettagli
                const subscription = await stripe.subscriptions.retrieve(
                    session.subscription as string
                );

                await prisma.company.update({
                    where: { id: companyId },
                    data: {
                        stripeCustomerId: session.customer as string,
                        stripeSubscriptionId: subscription.id,
                        stripePriceId:
                            subscription.items.data[0]?.price?.id ??
                            null,
                        stripeCurrentPeriodEnd:
                            getSubscriptionPeriodEnd(subscription),
                        subscriptionStatus: "ACTIVE",
                    },
                });

                console.log(
                    `✅ Company ${companyId} subscription activated`
                );
                break;
            }

            // ────────────────────────────────────────────
            // PAGAMENTO RICORRENTE RIUSCITO → Rinnova il periodo
            // ────────────────────────────────────────────
            case "invoice.payment_succeeded": {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId =
                    getSubscriptionIdFromInvoice(invoice);

                if (!subscriptionId) break;

                // Recupera la subscription aggiornata da Stripe
                const subscription =
                    await stripe.subscriptions.retrieve(subscriptionId);

                await prisma.company.update({
                    where: { stripeSubscriptionId: subscriptionId },
                    data: {
                        stripeCurrentPeriodEnd:
                            getSubscriptionPeriodEnd(subscription),
                        subscriptionStatus: "ACTIVE",
                    },
                });

                console.log(
                    `✅ Subscription ${subscriptionId} renewed successfully`
                );
                break;
            }

            // ────────────────────────────────────────────
            // SUBSCRIPTION AGGIORNATA → Sincronizza lo stato
            // ────────────────────────────────────────────
            case "customer.subscription.updated": {
                const subscription = event.data
                    .object as Stripe.Subscription;

                // Mappa lo status di Stripe al nostro enum
                const statusMap: Record<
                    string,
                    "ACTIVE" | "PAST_DUE" | "CANCELLED"
                > = {
                    active: "ACTIVE",
                    past_due: "PAST_DUE",
                    canceled: "CANCELLED",
                    unpaid: "PAST_DUE",
                };

                const mappedStatus =
                    statusMap[subscription.status] ?? "ACTIVE";

                await prisma.company.update({
                    where: { stripeSubscriptionId: subscription.id },
                    data: {
                        stripePriceId:
                            subscription.items.data[0]?.price?.id ??
                            null,
                        stripeCurrentPeriodEnd:
                            getSubscriptionPeriodEnd(subscription),
                        subscriptionStatus: mappedStatus,
                    },
                });

                console.log(
                    `✅ Subscription ${subscription.id} updated → ${mappedStatus}`
                );
                break;
            }

            // ────────────────────────────────────────────
            // SUBSCRIPTION CANCELLATA → Disattiva il piano
            // ────────────────────────────────────────────
            case "customer.subscription.deleted": {
                const subscription = event.data
                    .object as Stripe.Subscription;

                await prisma.company.update({
                    where: { stripeSubscriptionId: subscription.id },
                    data: {
                        subscriptionStatus: "CANCELLED",
                        stripePriceId: null,
                        stripeSubscriptionId: null,
                        stripeCurrentPeriodEnd: null,
                    },
                });

                console.log(
                    `✅ Subscription ${subscription.id} deleted → CANCELLED`
                );
                break;
            }

            default:
                // Evento non gestito — lo ignoriamo silenziosamente
                console.log(
                    `ℹ️ Unhandled event type: ${event.type}`
                );
        }
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "Unknown error";
        console.error(
            `❌ Error processing event ${event.type}: ${message}`
        );
        // Ritorniamo comunque 200 per evitare retry infiniti di Stripe
        // L'errore è nel nostro codice, non nella richiesta di Stripe
    }

    // 4. Rispondi sempre 200 a Stripe per confermare la ricezione
    return NextResponse.json({ received: true }, { status: 200 });
}
