"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerSheet } from "./CustomerSheet";

export function CustomersEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-zinc-200 rounded-lg bg-zinc-50/50">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
                <Users className="h-10 w-10 text-zinc-400" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-zinc-900">
                Nessun cliente trovato
            </h2>
            <p className="mt-2 text-center text-sm text-zinc-500 max-w-sm leading-relaxed">
                Non hai ancora aggiunto clienti alla tua lista. <br />
                Aggiungine uno per iniziare a gestire le tue attività.
            </p>
            <div className="mt-8">
                <CustomerSheet
                    trigger={
                        <Button>
                            Aggiungi il primo cliente
                        </Button>
                    }
                />
            </div>
        </div>
    );
}
