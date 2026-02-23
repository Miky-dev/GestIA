"use client";

import * as React from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerWithRangeProps {
    className?: string;
    initialDateRange?: DateRange;
}

export function DatePickerWithRange({
    className,
    initialDateRange,
}: DatePickerWithRangeProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Stato locale per l'interfaccia utente del calendario
    const [date, setDate] = React.useState<DateRange | undefined>(initialDateRange);

    // Gestione applicazione filtro: aggiorna i query params nell'URL
    const handleSelect = (newDate: DateRange | undefined) => {
        setDate(newDate);

        const params = new URLSearchParams(searchParams);

        if (newDate?.from) {
            params.set("from", format(newDate.from, "yyyy-MM-dd"));
        } else {
            params.delete("from");
        }

        if (newDate?.to) {
            params.set("to", format(newDate.to, "yyyy-MM-dd"));
        } else {
            params.delete("to");
        }

        // Push URL silently triggering Server Component re-render
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[280px] justify-start text-left font-normal bg-white shadow-sm",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-zinc-500" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "d LLL, y", { locale: it })} -{" "}
                                    {format(date.to, "d LLL, y", { locale: it })}
                                </>
                            ) : (
                                format(date.from, "d LLL, y", { locale: it })
                            )
                        ) : (
                            <span>Seleziona un periodo</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={handleSelect}
                        numberOfMonths={2}
                        locale={it}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
