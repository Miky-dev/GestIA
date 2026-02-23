"use client";

import { useState, useTransition } from "react";
import { format, isToday, isBefore, startOfToday, addDays, isPast } from "date-fns";
import { it } from "date-fns/locale";
import {
    CheckCircle2,
    Circle,
    CalendarClock,
    User,
    Plus
} from "lucide-react";

import { createTask, updateTaskStatus } from "@/actions/tasks";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskKanbanBoard } from "@/components/tasks/TaskKanbanBoard";
import { Button } from "@/components/ui/button";

// Tipo inferito dal return type di getTasks()
type TaskWithRelations = {
    id: string;
    title: string;
    description: string | null;
    dueDate: Date | null;
    priority: TaskPriority;
    status: TaskStatus;
    companyId: string;
    assigneeId: string | null;
    customerId: string | null;
    appointmentId: string | null;
    conversationId: string | null;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
    assignee: { name: string } | null;
    customer: { firstName: string; lastName: string; phoneE164: string } | null;
    appointment: { startTime: Date; serviceType: string } | null;
};

export function TasksClient({ initialTasks }: { initialTasks: TaskWithRelations[] }) {
    const [tasks, setTasks] = useState<TaskWithRelations[]>(initialTasks);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    // Raggruppamento tasks
    const today = startOfToday();
    const overdueTasks = tasks.filter(t => t.status !== TaskStatus.DONE && t.dueDate && isBefore(t.dueDate, today));
    const todayTasks = tasks.filter(t => t.status !== TaskStatus.DONE && (!t.dueDate || isToday(t.dueDate)));
    const upcomingTasks = tasks.filter(t => t.status !== TaskStatus.DONE && t.dueDate && isBefore(today, t.dueDate) && !isToday(t.dueDate));

    // Statistiche rapide
    const completedLast7Days = tasks.filter(t =>
        t.status === TaskStatus.DONE &&
        t.completedAt &&
        isBefore(addDays(today, -7), t.completedAt)
    ).length;

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        startTransition(async () => {
            try {
                await createTask({
                    title: newTaskTitle,
                    dueDate: new Date(),
                    priority: TaskPriority.MEDIUM,
                    status: TaskStatus.TODO
                });

                toast({
                    title: "Task creato",
                    description: "La nuova attività è stata aggiunta alla lista."
                });
                setNewTaskTitle("");
            } catch (error: any) {
                toast({
                    title: "Errore",
                    description: error.message || "Impossibile creare il task",
                    variant: "destructive"
                });
            }
        });
    };

    const handleToggleStatus = async (task: TaskWithRelations) => {
        const newStatus = task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;

        // Optimistic update locale
        setTasks(current =>
            current.map(t =>
                t.id === task.id ? { ...t, status: newStatus as TaskStatus, completedAt: newStatus === TaskStatus.DONE ? new Date() : null } : t
            )
        );

        startTransition(async () => {
            try {
                await updateTaskStatus(task.id, newStatus as TaskStatus);
            } catch (error: any) {
                // Revert in caso di errore
                setTasks(initialTasks);
                toast({
                    title: "Errore di sincronizzazione",
                    description: "Impossibile aggiornare lo stato del task.",
                    variant: "destructive"
                });
            }
        });
    };

    const renderTaskItem = (task: TaskWithRelations) => {
        const isDone = task.status === TaskStatus.DONE;
        const isOverdue = task.dueDate && isPast(task.dueDate) && !isToday(task.dueDate) && !isDone;

        return (
            <div
                key={task.id}
                className={`flex items-start gap-4 p-4 rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md ${isDone ? 'opacity-50' : ''}`}
            >
                <button
                    onClick={() => handleToggleStatus(task)}
                    disabled={isPending}
                    className="flex-shrink-0 focus:outline-none mt-0.5"
                    aria-label={isDone ? "Segna come da fare" : "Segna come completato"}
                >
                    {isDone ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500 transition-colors" />
                    ) : (
                        <Circle className={`h-6 w-6 ${isOverdue ? 'text-red-500' : 'text-muted-foreground hover:text-primary transition-colors'}`} />
                    )}
                </button>

                <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <p className={`text-base font-semibold leading-none ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Smart Relation: Customer */}
                        {task.customer && (
                            <Badge variant="secondary" className="text-xs px-2 py-0.5 font-medium hover:bg-secondary/80 cursor-pointer">
                                <User className="mr-1 h-3 w-3" />
                                {task.customer.firstName} {task.customer.lastName} • {task.customer.phoneE164}
                            </Badge>
                        )}

                        {/* Smart Relation: Appointment */}
                        {task.appointment && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium border-primary/20 bg-primary/5 text-primary">
                                Appt: {task.appointment.serviceType} - {format(task.appointment.startTime, "HH:mm")}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Assignee Avatar (Opzionale) */}
                {task.assignee && (
                    <Avatar className="h-8 w-8 flex-shrink-0 border bg-muted self-center ml-auto">
                        <AvatarFallback className="text-xs font-semibold">
                            {task.assignee.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto w-full">
            <Tabs defaultValue="list" className="w-full">

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Attività</h2>
                        <p className="text-muted-foreground">Gestisci e tieni traccia delle operazioni da svolgere.</p>
                    </div>

                    <TabsList className="grid w-full md:w-[400px] grid-cols-2">
                        <TabsTrigger value="list">Vista Elenco</TabsTrigger>
                        <TabsTrigger value="kanban">Board Kanban</TabsTrigger>
                    </TabsList>
                </div>

                {/* Inline Task Creator Todoist-style */}
                <form onSubmit={handleCreateTask} className="flex relative w-full items-center mb-6">
                    <Input
                        type="text"
                        placeholder="Scrivi un task e premi Invio..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="flex-1 h-12 text-base px-5 bg-muted/30 focus-visible:ring-primary focus-visible:bg-background transition-all shadow-inner"
                        disabled={isPending}
                    />
                    <Button
                        type="submit"
                        size="sm"
                        disabled={isPending || !newTaskTitle.trim()}
                        className="absolute right-1.5 h-9"
                    >
                        <Plus className="h-4 w-4 mr-1" /> Aggiungi
                    </Button>
                </form>

                <TabsContent value="list" className="mt-2 space-y-8">

                    {/* KPI Cards Area */}
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                        <Card className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold">Da fare oggi</CardTitle>
                                <CalendarClock className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{todayTasks.length}</div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-md transition-shadow border-red-100 dark:border-red-900">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className={`text-sm font-semibold ${overdueTasks.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>Scadute</CardTitle>
                                <CalendarClock className={`h-4 w-4 ${overdueTasks.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-3xl font-bold ${overdueTasks.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                    {overdueTasks.length}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-green-600">Completate (7gg)</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-600">{completedLast7Days}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* List View Columns Area */}
                    <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
                        {/* Column: Scadute */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="font-semibold text-lg flex items-center gap-2">Scadute</h3>
                                <Badge variant="destructive" className="rounded-full shadow-sm">{overdueTasks.length}</Badge>
                            </div>
                            <div className="flex flex-col gap-3">
                                {overdueTasks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                                        <span className="text-sm">Nessuna attività scaduta</span>
                                    </div>
                                ) : (
                                    overdueTasks.map(renderTaskItem)
                                )}
                            </div>
                        </div>

                        {/* Column: Oggi */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="font-semibold text-lg flex items-center gap-2 text-primary">Oggi</h3>
                                <Badge variant="default" className="rounded-full shadow-sm">{todayTasks.length}</Badge>
                            </div>
                            <div className="flex flex-col gap-3">
                                {todayTasks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                                        <span className="text-sm">Tutto pulito per oggi!</span>
                                    </div>
                                ) : (
                                    todayTasks.map(renderTaskItem)
                                )}
                            </div>
                        </div>

                        {/* Column: Prossimamente */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="font-semibold text-lg flex items-center gap-2">Prossimamente</h3>
                                <Badge variant="secondary" className="rounded-full shadow-sm bg-muted-foreground/10">{upcomingTasks.length}</Badge>
                            </div>
                            <div className="flex flex-col gap-3">
                                {upcomingTasks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                                        <span className="text-sm">Nessuna attività in programma</span>
                                    </div>
                                ) : (
                                    upcomingTasks.map(renderTaskItem)
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="kanban" className="mt-2">
                    <TaskKanbanBoard initialTasks={tasks} />
                </TabsContent>

            </Tabs>
        </div>
    );
}
