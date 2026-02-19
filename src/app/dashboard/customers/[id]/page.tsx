import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getCustomerById } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Mail, Phone, CalendarDays, MessageSquare } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default async function CustomerDetailPage({
    params,
}: {
    params: { id: string };
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const customer = await getCustomerById(params.id);

    if (!customer) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header navigazione */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="h-9 w-9">
                    <Link href="/dashboard/customers">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold text-zinc-900">
                    Dettaglio Cliente
                </h1>
            </div>

            {/* Card Anagrafica */}
            <Card className="border-zinc-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-zinc-100 bg-zinc-50/30 pb-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <Avatar className="h-20 w-20 border-2 border-white shadow-sm">
                            <AvatarFallback className="text-xl bg-zinc-100 text-zinc-600 font-medium">
                                {customer.firstName[0]}
                                {customer.lastName[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-bold text-zinc-900">
                                {customer.firstName} {customer.lastName}
                            </CardTitle>
                            <CardDescription className="text-zinc-500 flex items-center gap-2">
                                Creato il {format(new Date(customer.createdAt), "d MMMM yyyy", { locale: it })}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="font-medium text-sm text-zinc-900 uppercase tracking-wide">Contatti</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-zinc-600">
                                <div className="h-8 w-8 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100">
                                    <Phone className="h-4 w-4" />
                                </div>
                                <span className="font-medium">{customer.phoneE164}</span>
                            </div>
                            <div className="flex items-center gap-3 text-zinc-600">
                                <div className="h-8 w-8 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <span>{customer.email || "Nessuna email"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-medium text-sm text-zinc-900 uppercase tracking-wide">Note Interne</h3>
                        <div className="bg-zinc-50 rounded-lg p-4 text-zinc-600 text-sm border border-zinc-100 min-h-[100px]">
                            {customer.internalNotes || "Nessuna nota interna."}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-white border border-zinc-200 p-1 h-auto rounded-lg shadow-sm mb-6 w-full justify-start md:w-auto md:inline-flex">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 px-4 py-2 h-9">
                        Panoramica
                    </TabsTrigger>
                    <TabsTrigger value="messages" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 px-4 py-2 h-9">
                        Storico Messaggi
                    </TabsTrigger>
                    <TabsTrigger value="appointments" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 px-4 py-2 h-9">
                        Appuntamenti
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <Card className="border-dashed border-2 bg-transparent shadow-none">
                        <CardContent className="flex flex-col items-center justify-center h-48 text-zinc-400">
                            <p>Riepilogo attività e statistiche (Coming soon)</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="messages">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <MessageSquare className="h-5 w-5 text-zinc-500" />
                                Storico Conversazioni
                            </CardTitle>
                            <CardDescription>Visualizza tutti i messaggi scambiati con questo cliente.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-64 flex items-center justify-center bg-zinc-50/50 rounded-lg border border-dashed border-zinc-200 mx-6 mb-6">
                            <div className="text-center text-zinc-400">
                                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Integrazione Inbox in arrivo...</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="appointments">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <CalendarDays className="h-5 w-5 text-zinc-500" />
                                Prossimi Appuntamenti
                            </CardTitle>
                            <CardDescription>Gestisci le prenotazioni e gli incontri.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-64 flex items-center justify-center bg-zinc-50/50 rounded-lg border border-dashed border-zinc-200 mx-6 mb-6">
                            <div className="text-center text-zinc-400">
                                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Modulo Appuntamenti in sviluppo...</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
