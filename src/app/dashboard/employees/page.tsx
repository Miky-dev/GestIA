import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getEmployees } from "@/actions/employees";
import { EmployeesClient } from "@/components/employees/EmployeesClient";
import { ShieldX } from "lucide-react";

export default async function EmployeesPage() {
    const session = await auth();

    // Nessuna sessione → login
    if (!session) {
        redirect("/login");
    }

    // Accesso negato se non ADMIN
    if (session.user?.role !== "ADMIN") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                    <ShieldX className="h-7 w-7 text-red-500" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-zinc-900">
                    Accesso Negato
                </h2>
                <p className="mt-2 text-sm text-zinc-500 max-w-xs">
                    Solo gli amministratori possono accedere alla gestione del team.
                </p>
            </div>
        );
    }

    // Recupera i dipendenti (già filtrati per companyId nella server action)
    const result = await getEmployees();
    const employees = result.success ? result.data ?? [] : [];

    return (
        <div className="space-y-6">
            <EmployeesClient employees={employees} />
        </div>
    );
}
