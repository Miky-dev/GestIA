"use client";

import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";

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
        } catch {
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
            <div className="rounded-md border border-zinc-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-zinc-50/50">
                        <TableRow>
                            <TableHead className="w-[250px] pl-4">Nome Completo</TableHead>
                            <TableHead>Telefono</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Creato il</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.map((customer) => (
                            <TableRow key={customer.id} className="hover:bg-zinc-50/50">
                                <TableCell className="pl-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-xs bg-zinc-100 text-zinc-600 font-medium border border-zinc-200">
                                                {customer.firstName[0]}
                                                {customer.lastName[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-zinc-900">
                                            {customer.firstName} {customer.lastName}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-zinc-600 text-sm">
                                    {customer.phoneE164}
                                </TableCell>
                                <TableCell className="text-zinc-600 text-sm">
                                    {customer.email || "-"}
                                </TableCell>
                                <TableCell className="text-zinc-500 text-sm">
                                    {format(new Date(customer.createdAt), "d MMM yyyy", {
                                        locale: it,
                                    })}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            {/* Dettaglio */}
                                            <DropdownMenuItem asChild>
                                                <a href={`/dashboard/customers/${customer.id}`} className="flex items-center cursor-pointer">
                                                    <Eye className="mr-2 h-4 w-4 text-zinc-500" />
                                                    <span className="ml-2">Visualizza Dettaglio</span>
                                                </a>
                                            </DropdownMenuItem>

                                            {/* Modifica */}
                                            <DropdownMenuItem onClick={() => openEdit(customer)} className="cursor-pointer">
                                                <Pencil className="mr-2 h-4 w-4 text-zinc-500" />
                                                Modifica
                                            </DropdownMenuItem>

                                            {/* Elimina */}
                                            <DropdownMenuItem
                                                className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                                                onClick={() => handleDelete(customer.id)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Elimina
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
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
