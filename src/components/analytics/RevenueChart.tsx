"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { it } from "date-fns/locale"
import { format, parseISO } from "date-fns"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart"

const chartConfig = {
    revenue: {
        label: "Incassato",
        color: "hsl(var(--primary))",
    },
    lostRevenue: {
        label: "Perso",
        color: "hsl(var(--destructive))",
    },
} satisfies ChartConfig

interface RevenueChartProps {
    data: {
        date: string
        revenue: number
        lostRevenue: number
    }[]
}

export function RevenueChart({ data }: RevenueChartProps) {
    // Formattazione per asse X (es. "12 Mag")
    const formatXAxis = (tickItem: string) => {
        try {
            return format(parseISO(tickItem), "d MMM", { locale: it })
        } catch (e) {
            return tickItem
        }
    }

    // Formattatore Euro
    const currencyFormatter = (value: number) =>
        new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
        }).format(value)

    return (
        <Card className="shadow-sm border-zinc-200/60 overflow-hidden col-span-2">
            <CardHeader className="flex flex-col items-start space-y-0 pb-6 border-b border-zinc-100">
                <CardTitle className="text-lg font-bold">Andamento Fatturato vs. Perso</CardTitle>
                <CardDescription>
                    Analisi giornaliera degli incassi reali rispetto alle mancate entrate (No-Show/Disdette)
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <ChartContainer config={chartConfig} className="min-h-[300px] w-full aspect-auto h-[350px]">
                    <BarChart
                        accessibilityLayer
                        data={data}
                        margin={{
                            top: 10,
                            right: 10,
                            left: -20,
                            bottom: 0,
                        }}
                    >
                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-zinc-100" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            tickFormatter={formatXAxis}
                            className="text-zinc-500 font-medium"
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            tickFormatter={(value) => `€${value}`}
                            className="text-zinc-500 font-medium"
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    className="w-[180px] border-zinc-200 shadow-xl"
                                    formatter={(value: any, name: any) => (
                                        <div className="flex items-center justify-between w-full">
                                            <span className="text-zinc-500 capitalize">{chartConfig[name as keyof typeof chartConfig]?.label || name}:</span>
                                            <span className="font-bold tabular-nums">{currencyFormatter(value as number)}</span>
                                        </div>
                                    )}
                                />
                            }
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar
                            dataKey="revenue"
                            fill="var(--color-revenue)"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        />
                        <Bar
                            dataKey="lostRevenue"
                            fill="var(--color-lostRevenue)"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
