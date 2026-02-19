import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCustomerById } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Construction } from "lucide-react";
import Link from "next/link";

export default async function CustomerDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const customer = await getCustomerById(params.id);

    if (!customer) {
        return (
            <div className="p-8 text-center text-zinc-500">
                Cliente non trovato o accesso negato.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/customers">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold text-zinc-900">
                    {customer.firstName} {customer.lastName}
                </h1>
            </div>

            <Card>
                <CardContent className="flex flex-col items-center justify-center min-h-[300px] text-zinc-500 space-y-4">
                    <Construction className="h-12 w-12 text-zinc-300" />
                    <p>
                        La vista di dettaglio è in lavorazione. <br />
                        Qui vedrai lo storico conversazioni e appuntamenti.
                    </p>
                    <div className="text-sm bg-zinc-50 p-4 rounded border border-zinc-100 font-mono">
                        ID: {customer.id} <br />
                        Tel: {customer.phoneE164} <br />
                        Email: {customer.email || "N/A"}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
