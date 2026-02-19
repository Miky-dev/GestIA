import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const { id, name, email, companyId, role } = session.user;

    return (
        <div className="space-y-6">
            {/* Benvenuto */}
            <div>
                <h1 className="text-2xl font-semibold text-zinc-900">
                    Bentornato, {name ?? email} 👋
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                    Ecco una panoramica del tuo account.
                </p>
            </div>

            {/* Badge tecnico verifica multi-tenant */}
            <Card className="border-zinc-200 shadow-sm max-w-md">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        Verifica Isolamento Multi-Tenant
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <dt className="text-zinc-500 font-medium">User ID</dt>
                            <dd className="font-mono text-xs bg-zinc-100 px-2 py-0.5 rounded text-zinc-700">
                                {id}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <dt className="text-zinc-500 font-medium">Company ID</dt>
                            <dd className="font-mono text-xs bg-emerald-50 px-2 py-0.5 rounded text-emerald-700 border border-emerald-100">
                                {companyId}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <dt className="text-zinc-500 font-medium">Role</dt>
                            <dd>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-900 text-white">
                                    {role}
                                </span>
                            </dd>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <dt className="text-zinc-500 font-medium">Email</dt>
                            <dd className="text-zinc-700 text-xs">{email}</dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>
        </div>
    );
}
