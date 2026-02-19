import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCustomers } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomersTable } from "@/components/customers/CustomersTable";
import { CustomerSheet } from "@/components/customers/CustomerSheet";
import { Plus } from "lucide-react";

export default async function CustomersPage() {
    const session = await auth();
    if (!session) {
        redirect("/login");
    }

    // Fetch dei dati direttamente nel Server Component
    const customers = await getCustomers();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                        Clienti
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Gestisci la lista dei tuoi clienti e i loro contatti.
                    </p>
                </div>

                {/* Bottone per creare un nuovo cliente */}
                <CustomerSheet
                    trigger={
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nuovo Cliente
                        </Button>
                    }
                />
            </div>

            <Card className="border-zinc-200 shadow-sm">
                <CardHeader className="p-4 border-b border-zinc-100">
                    <CardTitle className="text-base font-medium">Lista Clienti</CardTitle>
                    <CardDescription className="text-xs">
                        Visualizza tutti i clienti registrati per la tua azienda (Totale: {customers.length})
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <CustomersTable customers={customers} />
                </CardContent>
            </Card>
        </div>
    );
}
