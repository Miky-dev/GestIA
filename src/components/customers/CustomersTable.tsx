"use client";

import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CustomerSheet } from "./CustomerSheet";
import { deleteCustomer } from "@/actions/customers";
import { useToast } from "@/hooks/use-toast";

interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phoneE164: string;
    internalNotes: string | null;
    createdAt: Date;
}

interface CustomersTableProps {
    customers: Customer[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
    const { toast } = useToast();
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const handleDelete = async (id: string) => {
        if (!confirm("Sei sicuro di voler eliminare questo cliente?")) return;

        try {
            await deleteCustomer(id);
            toast({
                title: "Cliente eliminato",
                description: "Il cliente è stato rimosso correttamente.",
            });
        } catch (error) {
            toast({
                title: "Errore",
                description: "Impossibile eliminare il cliente.",
                variant: "destructive",
            });
        }
    };

    const openEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsSheetOpen(true);
    };

    const closeSheet = () => {
        setIsSheetOpen(false);
        setEditingCustomer(null);
    };

    return (
        <>
            <div className="rounded-md border border-zinc-200 bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Avatar</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Contatti</TableHead>
                            <TableHead>Note</TableHead>
                            <TableHead>Inserito il</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                                    Nessun cliente trovato. Aggiungine uno!
                                </TableCell>
                            </TableRow>
                        ) : (
                            customers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell>
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback className="text-xs bg-zinc-100 text-zinc-600">
                                                {customer.firstName[0]}
                                                {customer.lastName[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {customer.firstName} {customer.lastName}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span className="text-zinc-900">{customer.phoneE164}</span>
                                            {customer.email && (
                                                <span className="text-zinc-500 text-xs">{customer.email}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-zinc-500 text-sm">
                                        {customer.internalNotes || "-"}
                                    </TableCell>
                                    <TableCell className="text-zinc-500 text-sm">
                                        {format(new Date(customer.createdAt), "d MMM yyyy", {
                                            locale: it,
                                        })}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEdit(customer)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Modifica
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600"
                                                    onClick={() => handleDelete(customer.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Elimina
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Sheet singolo per Create & Edit */}
            <CustomerSheet
                open={isSheetOpen}
                onOpenChange={(open) => {
                    if (!open) closeSheet();
                    else setIsSheetOpen(true);
                }}
                customerToEdit={editingCustomer}
                onClose={closeSheet}
            />
        </>
    );
}
