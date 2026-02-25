import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardMetrics } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare, CircleDollarSign, Plus, Users, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { QuickAgendaClient } from "@/components/dashboard/QuickAgendaClient";

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const { name, email } = session.user;
    const userName = name || email;

    // Fetch metrics in parallel
    const metrics = await getDashboardMetrics();

    // Format currency
    const formattedRevenue = new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR",
    }).format(metrics.expectedRevenue);

    return (
        <div className="flex-1 space-y-8 p-8 w-full bg-muted/40 min-h-[calc(100vh-4rem)]">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Panoramica di Oggi
                </h1>
                <p className="text-muted-foreground mt-2">
                    Buongiorno, {userName} 👋
                </p>
            </div>

            {/* KPI Cards Row */}
            <div className="grid gap-4 md:grid-cols-4">
                {/* Card 1: Appuntamenti Oggi */}
                <Card className="shadow-sm border-border/50 bg-background">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Appuntamenti Oggi
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.appointmentsToday}</div>
                    </CardContent>
                </Card>

                {/* Card 2: Da Rispondere */}
                <Link href="/dashboard/inbox" className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
                    <Card className="shadow-sm border-border/50 bg-background h-full hover:border-primary/20 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Da Rispondere
                            </CardTitle>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${metrics.unreadMessages > 0 ? "text-destructive" : ""}`}>
                                {metrics.unreadMessages}
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* Card 3: Incasso Previsto */}
                <Link href="/dashboard/analytics" className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
                    <Card className="shadow-sm border-border/50 bg-background h-full hover:border-primary/20 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Incasso Previsto
                            </CardTitle>
                            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formattedRevenue}</div>
                        </CardContent>
                    </Card>
                </Link>

                {/* Card 4: Attività Urgenti */}
                <Link href="/dashboard/tasks" className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
                    <Card className="shadow-sm border-border/50 bg-background h-full hover:border-primary/20 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className={`text-sm font-medium ${metrics.overdueTasksCount > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                                Attività Urgenti
                            </CardTitle>
                            <AlertTriangle className={`h-4 w-4 ${metrics.overdueTasksCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${metrics.overdueTasksCount > 0 ? "text-destructive" : ""}`}>
                                {metrics.overdueTasksCount}
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Layout a 2 Colonne */}
            <div className="grid gap-6 md:grid-cols-10">

                {/* Colonna SX: Agenda Veloce (70% -> col-span-7) */}
                <div className="md:col-span-7">
                    <Card className="shadow-sm border-border/50 bg-background h-full">
                        <CardHeader>
                            <CardTitle>Agenda Veloce</CardTitle>
                            <CardDescription>
                                I tuoi prossimi appuntamenti per oggi.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <QuickAgendaClient appointments={metrics.upcomingAppointments} />
                        </CardContent>
                    </Card>
                </div>

                {/* Colonna DX: Azioni Rapide e Task (30% -> col-span-3) */}
                <div className="md:col-span-3 flex flex-col gap-6">
                    <Card className="shadow-sm border-border/50 bg-background flex-shrink-0">
                        <CardHeader>
                            <CardTitle>Azioni Rapide</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Link href="/dashboard/calendar" className="block">
                                <Button className="w-full justify-start h-12" variant="outline">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nuovo Appuntamento
                                </Button>
                            </Link>
                            <Link href="/dashboard/customers" className="block">
                                <Button className="w-full justify-start h-12" variant="outline">
                                    <Users className="mr-2 h-4 w-4" />
                                    Nuovo Cliente
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Card Task di Oggi */}
                    <Card className="shadow-sm border-border/50 bg-background flex-1 flex flex-col min-h-[300px]">
                        <CardHeader className="pb-3">
                            <CardTitle>Task di Oggi</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-between h-[100%]">
                            {metrics.urgentTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground/60 h-full">
                                    <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
                                    <p className="text-sm">Ottimo lavoro, nessuna attività in sospeso!</p>
                                </div>
                            ) : (
                                <div className="space-y-2 mb-4">
                                    {metrics.urgentTasks.map((task) => (
                                        <div key={task.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors gap-2 overflow-hidden">
                                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                                                <div
                                                    className={`w-2 h-2 rounded-full shrink-0 ${task.priority === 'URGENT' ? 'bg-red-500' : task.priority === 'HIGH' ? 'bg-yellow-500' : task.priority === 'MEDIUM' ? 'bg-blue-500' : 'bg-gray-400'}`}
                                                />
                                                <span className="text-xs font-medium truncate" title={task.title}>{task.title}</span>
                                            </div>
                                            {task.customer && (
                                                <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-muted text-muted-foreground max-w-[70px] truncate" title={`${task.customer.firstName} ${task.customer.lastName}`}>
                                                    {task.customer.firstName} {task.customer.lastName}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-auto pt-3 border-t">
                                <Link href="/dashboard/tasks" className="block">
                                    <Button variant="outline" className="w-full text-xs h-8">
                                        Vedi tutte le attività &rarr;
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                </div>

            </div>
        </div>
    );
}
