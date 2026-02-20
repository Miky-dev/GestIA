"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, Mail, FileText, Calendar } from "lucide-react";

interface CustomerSidebarProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customer: any; // Useremo il tipo corretto (Customer) in futuro
}

export function CustomerSidebar({ customer }: CustomerSidebarProps) {
    if (!customer) return null;

    const initials = (customer.firstName?.[0] || "") + (customer.lastName?.[0] || "");

    return (
        <div className="h-full flex flex-col p-6 overflow-y-auto">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-6">
                Dettagli Cliente
            </h3>

            <div className="flex flex-col items-center text-center mb-8">
                <Avatar className="h-20 w-20 mb-4 text-lg">
                    <AvatarFallback className="bg-primary/10 text-primary">
                        {initials.toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <span className="text-xl font-bold">{customer.firstName} {customer.lastName}</span>
                <span className="text-sm text-muted-foreground mt-1">Cliente dal {new Date(customer.createdAt).getFullYear()}</span>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-3 border-b pb-4">
                    <div className="bg-slate-100 p-2 rounded-full text-slate-600">
                        <Phone size={16} />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Telefono</p>
                        <p className="text-sm font-medium">{customer.phoneE164}</p>
                    </div>
                </div>

                {customer.email && (
                    <div className="flex items-center gap-3 border-b pb-4">
                        <div className="bg-slate-100 p-2 rounded-full text-slate-600">
                            <Mail size={16} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="text-sm font-medium">{customer.email}</p>
                        </div>
                    </div>
                )}

                {customer.vatNumber && (
                    <div className="flex items-center gap-3 border-b pb-4">
                        <div className="bg-slate-100 p-2 rounded-full text-slate-600">
                            <FileText size={16} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">P.IVA</p>
                            <p className="text-sm font-medium uppercase">{customer.vatNumber}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8">
                <button className="w-full flex items-center justify-center gap-2 border shadow-sm rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors">
                    <Calendar size={16} />
                    Nuovo Appuntamento
                </button>
            </div>
        </div>
    );
}
