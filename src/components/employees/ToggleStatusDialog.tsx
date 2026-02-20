"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

import { toggleEmployeeStatus } from "@/actions/employees";

interface ToggleStatusDialogProps {
    isOpen: boolean;
    onClose: () => void;
    employeeId: string;
    employeeName: string;
    currentStatus: boolean; // true = attivo, false = disattivato
}

export function ToggleStatusDialog({
    isOpen,
    onClose,
    employeeId,
    employeeName,
    currentStatus,
}: ToggleStatusDialogProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const isActive = currentStatus;

    function handleConfirm() {
        startTransition(async () => {
            try {
                const result = await toggleEmployeeStatus(employeeId);

                if (!result.success) {
                    toast({
                        title: "Errore",
                        description: result.error ?? "Operazione non riuscita. Riprova.",
                        variant: "destructive",
                    });
                    return;
                }

                toast({
                    title: isActive ? "Dipendente disattivato" : "Dipendente riattivato",
                    description: isActive
                        ? `${employeeName} non può più accedere al sistema.`
                        : `${employeeName} può di nuovo accedere al sistema.`,
                });

                onClose();
            } catch {
                toast({
                    title: "Errore inaspettato",
                    description: "Si è verificato un problema. Riprova più tardi.",
                    variant: "destructive",
                });
            }
        });
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {isActive
                            ? `Disattivare ${employeeName}?`
                            : `Riattivare ${employeeName}?`}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {isActive
                            ? "Non potrà più accedere al sistema, ma il suo storico appuntamenti verrà conservato."
                            : `${employeeName} potrà di nuovo accedere al sistema con le sue credenziali.`}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>
                        Annulla
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isPending}
                        className={
                            isActive
                                ? "bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
                                : "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-600 text-white"
                        }
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isActive ? "Disattiva" : "Riattiva"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
