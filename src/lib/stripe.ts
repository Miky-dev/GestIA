import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
    if (!stripeInstance) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error(
                "STRIPE_SECRET_KEY is not set. Add it to your .env file."
            );
        }
        stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2026-02-25.clover",
            typescript: true,
        });
    }
    return stripeInstance;
}

// Alias per retrocompatibilità — valutato lazy
export const stripe = new Proxy({} as Stripe, {
    get(_, prop) {
        return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
    },
});
