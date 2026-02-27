"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const billingUrl = `${APP_URL}/dashboard/settings/billing`;

/**
 * Crea una Stripe Checkout Session per avviare un nuovo abbonamento.
 * Ritorna l'URL di Stripe a cui reindirizzare l'utente.
 */
export async function createCheckoutSession(priceId: string) {
    const session = await auth();
    if (!session?.user?.companyId) {
        throw new Error("Unauthorized");
    }

    // Recupera la company con i dati Stripe e l'email dell'admin
    const company = await prisma.company.findUnique({
        where: { id: session.user.companyId },
        select: {
            id: true,
            stripeCustomerId: true,
            users: {
                where: { role: "ADMIN" },
                select: { email: true },
                take: 1,
            },
        },
    });

    if (!company) {
        throw new Error("Company not found");
    }

    // Prepara i parametri della sessione Checkout
    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        // CRITICO: client_reference_id permette di identificare chi ha pagato nel webhook
        client_reference_id: company.id,
        success_url: `${billingUrl}?success=true`,
        cancel_url: `${billingUrl}?canceled=true`,
    };

    // Se la company ha già un customer Stripe, lo riusa; altrimenti passa l'email
    if (company.stripeCustomerId) {
        checkoutParams.customer = company.stripeCustomerId;
    } else {
        const adminEmail = company.users[0]?.email;
        if (adminEmail) {
            checkoutParams.customer_email = adminEmail;
        }
    }

    const checkoutSession = await stripe.checkout.sessions.create(checkoutParams);

    if (!checkoutSession.url) {
        throw new Error("Failed to create checkout session");
    }

    return { url: checkoutSession.url };
}

/**
 * Crea una sessione del Stripe Customer Portal per gestire l'abbonamento.
 * Ritorna l'URL del portale a cui reindirizzare l'utente.
 */
export async function createBillingPortalSession() {
    const session = await auth();
    if (!session?.user?.companyId) {
        throw new Error("Unauthorized");
    }

    const company = await prisma.company.findUnique({
        where: { id: session.user.companyId },
        select: { stripeCustomerId: true },
    });

    if (!company?.stripeCustomerId) {
        throw new Error(
            "No Stripe customer found. Please subscribe to a plan first."
        );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
        customer: company.stripeCustomerId,
        return_url: billingUrl,
    });

    return { url: portalSession.url };
}
