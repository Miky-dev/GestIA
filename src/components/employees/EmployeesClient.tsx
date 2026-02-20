"use client";

import { useState } from "react";
import { Users, MoreHorizontal, Pencil, PowerOff, Power, UserPlus } from "lucide-react";

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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { EmployeeSheet, type Employee } from "./EmployeeSheet";
import { ToggleStatusDialog } from "./ToggleStatusDialog";

interface EmployeesClientProps {
    employees: Employee[];
}

export function EmployeesClient({ employees }: EmployeesClientProps) {
    // Sheet (creazione / modifica)
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    // Dialog toggle status
    const [isToggleOpen, setIsToggleOpen] = useState(false);
    const [toggleTarget, setToggleTarget] = useState<Employee | null>(null);

    function openCreate() {
        setSelectedEmployee(null);
        setIsSheetOpen(true);
    }

    function openEdit(employee: Employee) {
        setSelectedEmployee(employee);
        setIsSheetOpen(true);
    }

    function openToggle(employee: Employee) {
        setToggleTarget(employee);
        setIsToggleOpen(true);
    }

    function closeSheet() {
        setIsSheetOpen(false);
        setSelectedEmployee(null);
    }

    function closeToggle() {
        setIsToggleOpen(false);
        setToggleTarget(null);
    }

    return (
        <>
            {/* ===== HEADER ===== */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                        Gestione Team
                    </h1>
                    <p className="mt-1 text-sm text-zinc-500">
                        {employees.length} {employees.length === 1 ? "membro" : "membri"} nel team
                    </p>
                </div>
                <Button onClick={openCreate} className="h-9 gap-2">
                    <UserPlus className="h-4 w-4" />
                    Aggiungi Membro
                </Button>
            </div>

            {/* ===== TABELLA o EMPTY STATE ===== */}
            {employees.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white py-20 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
                        <Users className="h-6 w-6 text-zinc-400" />
                    </div>
                    <h3 className="mt-4 text-base font-medium text-zinc-900">
                        Nessun membro nel team
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500">
                        Aggiungi il primo membro per iniziare.
                    </p>
                    <Button onClick={openCreate} variant="outline" className="mt-6 h-9 gap-2">
                        <UserPlus className="h-4 w-4" />
                        Aggiungi Membro
                    </Button>
                </div>
            ) : (
                <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-zinc-50/60">
                            <TableRow className="hover:bg-transparent border-zinc-100">
                                <TableHead className="pl-5 w-[260px] text-xs font-medium text-zinc-500 uppercase tracking-wide">
                                    Nome
                                </TableHead>
                                <TableHead className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                                    Email
                                </TableHead>
                                <TableHead className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                                    Ruolo
                                </TableHead>
                                <TableHead className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                                    Stato
                                </TableHead>
                                <TableHead className="w-[52px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.map((employee) => (
                                <TableRow
                                    key={employee.id}
                                    className="hover:bg-zinc-50/50 border-zinc-100 transition-colors"
                                >
                                    {/* Nome */}
                                    <TableCell className="pl-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8 shrink-0">
                                                <AvatarFallback
                                                    className={`text-xs font-semibold border ${employee.isActive
                                                            ? "bg-zinc-100 text-zinc-700 border-zinc-200"
                                                            : "bg-zinc-50 text-zinc-400 border-zinc-100"
                                                        }`}
                                                >
                                                    {employee.name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .slice(0, 2)
                                                        .join("")
                                                        .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span
                                                className={`text-sm font-medium ${employee.isActive ? "text-zinc-900" : "text-zinc-400"
                                                    }`}
                                            >
                                                {employee.name}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Email */}
                                    <TableCell className="text-sm text-zinc-500 py-3.5">
                                        {employee.email}
                                    </TableCell>

                                    {/* Ruolo */}
                                    <TableCell className="py-3.5">
                                        {employee.role === "ADMIN" ? (
                                            <Badge
                                                variant="secondary"
                                                className="bg-violet-50 text-violet-700 border-violet-100 border font-medium text-xs"
                                            >
                                                Admin
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="secondary"
                                                className="bg-zinc-100 text-zinc-600 border-zinc-200 border font-medium text-xs"
                                            >
                                                Segreteria
                                            </Badge>
                                        )}
                                    </TableCell>

                                    {/* Stato */}
                                    <TableCell className="py-3.5">
                                        {employee.isActive ? (
                                            <Badge
                                                variant="secondary"
                                                className="bg-emerald-50 text-emerald-700 border-emerald-100 border font-medium text-xs"
                                            >
                                                Attivo
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="secondary"
                                                className="bg-red-50 text-red-600 border-red-100 border font-medium text-xs"
                                            >
                                                Disattivato
                                            </Badge>
                                        )}
                                    </TableCell>

                                    {/* Azioni */}
                                    <TableCell className="py-3.5 pr-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Azioni</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-44">
                                                <DropdownMenuItem
                                                    onClick={() => openEdit(employee)}
                                                    className="cursor-pointer"
                                                >
                                                    <Pencil className="mr-2 h-4 w-4 text-zinc-500" />
                                                    Modifica
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem
                                                    onClick={() => openToggle(employee)}
                                                    className={`cursor-pointer ${employee.isActive
                                                            ? "text-red-600 focus:text-red-700 focus:bg-red-50"
                                                            : "text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50"
                                                        }`}
                                                >
                                                    {employee.isActive ? (
                                                        <>
                                                            <PowerOff className="mr-2 h-4 w-4" />
                                                            Disattiva
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Power className="mr-2 h-4 w-4" />
                                                            Riattiva
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* ===== SHEET CREA/MODIFICA ===== */}
            <EmployeeSheet
                isOpen={isSheetOpen}
                onClose={closeSheet}
                employeeToEdit={selectedEmployee}
            />

            {/* ===== DIALOG TOGGLE STATUS ===== */}
            {toggleTarget && (
                <ToggleStatusDialog
                    isOpen={isToggleOpen}
                    onClose={closeToggle}
                    employeeId={toggleTarget.id}
                    employeeName={toggleTarget.name}
                    currentStatus={toggleTarget.isActive}
                />
            )}
        </>
    );
}
