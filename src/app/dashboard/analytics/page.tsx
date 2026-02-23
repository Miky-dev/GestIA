import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBusinessAnalytics } from "@/actions/analytics";
import { DatePickerWithRange } from "@/components/analytics/DateRangePicker";
import { KpiCards } from "@/components/analytics/KpiCards";
import { RevenueChart } from "@/components/analytics/RevenueChart";
import { PerformanceTables } from "@/components/analytics/PerformanceTables";
import { subDays, parse } from "date-fns";
import { ShieldAlert } from "lucide-react";

export default async function AnalyticsPage(props: {
    searchParams?: Promise<{ from?: string; to?: string }>;
}) {
    const session = await auth();

    // 1. RBAC Security Check
    if (!session?.user) {
        redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-8">
                <div className="bg-red-50 border border-red-100 rounded-2xl p-8 max-w-md text-center shadow-sm">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-red-900 mb-2">Accesso Negato</h1>
                    <p className="text-red-600/80">
                        La sezione Performance Aziendale contiene dati finanziari sensibili ed è riservata esclusivamente agli amministratori del sistema (titolari).
                    </p>
                </div>
            </div>
        );
    }

    // 2. Parse Search Params and Determine Date Range (Default: Last 30 Days)
    const rawSearchParams = await props.searchParams;
    const now = new Date();
    const defaultFrom = subDays(now, 30);
    const defaultTo = now;

    let startDate = defaultFrom;
    let endDate = defaultTo;

    if (rawSearchParams?.from) {
        const parsedFrom = parse(rawSearchParams.from, "yyyy-MM-dd", new Date());
        if (!isNaN(parsedFrom.getTime())) startDate = parsedFrom;
    }

    if (rawSearchParams?.to) {
        const parsedTo = parse(rawSearchParams.to, "yyyy-MM-dd", new Date());
        // Set to end of day
        if (!isNaN(parsedTo.getTime())) {
            parsedTo.setHours(23, 59, 59, 999);
            endDate = parsedTo;
        }
    }

    const dateRange = {
        from: startDate,
        to: endDate,
    };

    // 3. Fetch Data Backend
    const analytics = await getBusinessAnalytics(startDate, endDate);

    // Formatters
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: "EUR",
        }).format(value);
    };

    return (
        <div className="flex-1 space-y-8 p-8 w-full bg-zinc-50/50 min-h-[calc(100vh-4rem)]">

            {/* Header with DatePicker */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                        Performance Aziendale
                    </h1>
                    <p className="text-zinc-500 mt-2">
                        Analizza metriche finanziarie, efficienza dello staff e vendite servizi.
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-md border shadow-sm">
                    <span className="text-sm font-medium text-zinc-500 px-3 hidden md:inline-block">Periodo:</span>
                    <DatePickerWithRange initialDateRange={dateRange} />
                </div>
            </div>

            {/* Row 1: KPI Cards */}
            <KpiCards data={analytics} />

            {/* Row 2: Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                <RevenueChart data={analytics.revenueOverTime} />
            </div>

            {/* Row 3: Leaderboards & Service Distribution */}
            <PerformanceTables
                topServices={analytics.topServices}
                staffPerformance={analytics.staffPerformance}
            />
        </div>
    );
}
