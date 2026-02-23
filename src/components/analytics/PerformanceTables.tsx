"use client"

import * as React from "react"
import { Pie, PieChart, Label } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface PerformanceTablesProps {
    topServices: {
        serviceType: string
        count: number
    }[]
    staffPerformance: {
        userId: string
        userName: string
        completedAppointments: number
        generatedRevenue: number
    }[]
}

const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--primary) / 0.8)",
    "hsl(var(--primary) / 0.6)",
    "hsl(var(--primary) / 0.4)",
    "hsl(var(--primary) / 0.2)",
]

export function PerformanceTables({ topServices, staffPerformance }: PerformanceTablesProps) {
    // Prepara i dati per il Donut Chart
    const chartData = topServices.map((service, index) => ({
        service: service.serviceType,
        count: service.count,
        fill: COLORS[index % COLORS.length],
    }))

    const chartConfig = topServices.reduce((acc, service, index) => {
        acc[service.serviceType] = {
            label: service.serviceType,
            color: COLORS[index % COLORS.length],
        }
        return acc
    }, {} as ChartConfig)

    const totalServices = React.useMemo(() => {
        return chartData.reduce((acc, curr) => acc + curr.count, 0)
    }, [chartData])

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
        }).format(value)
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Top Services - Donut Chart */}
            <Card className="flex flex-col shadow-sm border-zinc-200/60 overflow-hidden">
                <CardHeader className="items-center pb-0 border-b border-zinc-100 mb-6 py-6">
                    <CardTitle className="text-lg font-bold">Distribuzione Servizi</CardTitle>
                    <CardDescription>I 5 servizi più richiesti nel periodo</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square max-h-[300px]"
                    >
                        <PieChart>
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Pie
                                data={chartData}
                                dataKey="count"
                                nameKey="service"
                                innerRadius={70}
                                outerRadius={100}
                                strokeWidth={5}
                                paddingAngle={5}
                            >
                                <Label
                                    content={({ viewBox }) => {
                                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                            return (
                                                <text
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                >
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        className="fill-foreground text-3xl font-bold"
                                                    >
                                                        {totalServices.toLocaleString()}
                                                    </tspan>
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={(viewBox.cy || 0) + 24}
                                                        className="fill-muted-foreground text-sm"
                                                    >
                                                        Appuntamenti
                                                    </tspan>
                                                </text>
                                            )
                                        }
                                    }}
                                />
                            </Pie>
                        </PieChart>
                    </ChartContainer>

                    <div className="grid grid-cols-1 gap-2 py-6">
                        {chartData.map((item) => (
                            <div key={item.service} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                    <span className="font-medium text-zinc-600">{item.service}</span>
                                </div>
                                <span className="font-bold text-zinc-900">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Staff Leaderboard */}
            <Card className="shadow-sm border-zinc-200/60 overflow-hidden flex flex-col">
                <CardHeader className="border-b border-zinc-100 py-6">
                    <CardTitle className="text-lg font-bold">Classifica Performance Staff</CardTitle>
                    <CardDescription>Produttività e fatturato generato dai collaboratori</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 flex-1">
                    {staffPerformance.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center py-12 text-zinc-400">
                            <p className="italic">Nessuna attività registrata per lo staff.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {staffPerformance.map((staff, index) => (
                                <div key={staff.userId} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
                                                <AvatarFallback className="bg-zinc-900 text-white font-bold">
                                                    {staff.userName.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -top-1 -left-1 bg-zinc-100 text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border shadow-sm">
                                                {index + 1}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-bold text-zinc-900 leading-none mb-1">{staff.userName}</p>
                                            <p className="text-xs text-zinc-500 font-medium">
                                                {staff.completedAppointments} appuntamenti completati
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-zinc-900">{formatCurrency(staff.generatedRevenue)}</p>
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                            Fatturato
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
