"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, Users } from "lucide-react";
import type { AnalyticsData } from "@/actions/analytics";

interface KpiCardsProps {
    data: AnalyticsData;
}

export function KpiCards({ data }: KpiCardsProps) {
    // 1. Formattazione Valuta
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: "EUR",
        }).format(value);
    };

    // 2. Calcoli Derivati
    const totalAppointments = data.appointmentsByStatus.reduce((acc, curr) => acc + curr.count, 0);
    const completedAppointments = data.appointmentsByStatus.find(s => s.status === 'COMPLETED')?.count || 0;

    // Tasso Completamento
    const completionRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;
    const isGoodCompletion = completionRate >= 85;

    // Calcolo "Emorragia" (Mancati)
    const missedAppointments = data.appointmentsByStatus
        .filter(s => s.status === 'NO_SHOW' || s.status === 'CANCELLED')
        .reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

            {/* Card 1: Fatturato Generato */}
            <Card className="shadow-sm border border-emerald-100 overflow-hidden group">
                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-emerald-50/50 border-b border-emerald-100/50 transition-colors group-hover:bg-emerald-50">
                    <CardTitle className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">
                        Fatturato Generato
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-emerald-600">{formatCurrency(data.revenue)}</div>
                    <p className="text-xs text-emerald-600/70 mt-1 font-medium">Totale incassato nel periodo</p>
                </CardContent>
            </Card>

            {/* Card 2: L'Emorragia (Fatturato Perso) */}
            <Card className="shadow-sm border border-red-100 overflow-hidden group">
                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-red-50/50 border-b border-red-100/50 transition-colors group-hover:bg-red-50">
                    <CardTitle className="text-sm font-semibold text-red-700 uppercase tracking-wider" title="Fatturato Perso (No-Show/Disdette)">
                        Fatturato Perso
                    </CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-red-600">{formatCurrency(data.lostRevenue)}</div>
                    <p className="text-xs text-red-600/70 mt-1 font-medium">
                        {missedAppointments} appuntament{missedAppointments === 1 ? 'o mancato' : 'i mancati'}
                    </p>
                </CardContent>
            </Card>

            {/* Card 3: Tasso di Completamento */}
            <Card className="shadow-sm border-zinc-200/60 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-zinc-50/50 border-b border-zinc-100/50">
                    <CardTitle className="text-sm font-semibold text-zinc-600 uppercase tracking-wider">
                        Tasso di completamento
                    </CardTitle>
                    <Activity className={`h-4 w-4 ${isGoodCompletion ? 'text-emerald-500' : 'text-amber-500'}`} />
                </CardHeader>
                <CardContent className="pt-6">
                    <div className={`text-3xl font-bold ${isGoodCompletion ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {completionRate}%
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 font-medium">
                        {completedAppointments} su {totalAppointments} effettuati
                    </p>
                </CardContent>
            </Card>

            {/* Card 4: Nuovi Clienti (Acquisizione) */}
            <Card className="shadow-sm border border-blue-100 overflow-hidden group">
                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-blue-50/50 border-b border-blue-100/50 transition-colors group-hover:bg-blue-50">
                    <CardTitle className="text-sm font-semibold text-blue-700 uppercase tracking-wider">
                        Nuovi Clienti
                    </CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-blue-600">{data.newCustomers}</div>
                    <p className="text-xs text-blue-600/70 mt-1 font-medium">Anagrafiche create</p>
                </CardContent>
            </Card>

        </div>
    );
}
