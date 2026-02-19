import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCustomers } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { CustomersTable } from "@/components/customers/CustomersTable";
import { CustomerSheet } from "@/components/customers/CustomerSheet";
import { CustomersEmptyState } from "@/components/customers/CustomersEmptyState";
import { Plus } from "lucide-react";

export default async function CustomersPage() {
    const session = await auth();
    if (!session) {
        redirect("/login");
    }

    const customers = await getCustomers();

    return (
        <div className="space-y-6">
            {/* Header sempre visibile (o condizionale se preferisci nasconderlo nell'empty state) */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                    Clienti
                </h1>
                {customers.length > 0 && (
                    <CustomerSheet
                        trigger={
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Nuovo Cliente
                            </Button>
                        }
                    />
                )}
            </div>

            {customers.length === 0 ? (
                <CustomersEmptyState />
            ) : (
                <CustomersTable customers={customers} />
            )}
        </div>
    );
}
