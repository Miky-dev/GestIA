"use client";

import { useState, useTransition, useMemo } from "react";
import { format, isPast, isToday } from "date-fns";
import { it } from "date-fns/locale";
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    useDroppable,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { TaskStatus, TaskPriority } from "@prisma/client";
import { updateTaskStatus } from "@/actions/tasks";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarClock, User, AlertCircle } from "lucide-react";

// Tipi (Inferred dal server)
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

// =====================================
// UTILS
// =====================================
const COLUMNS: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];

const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
        case "URGENT": return "border-l-red-500 bg-red-50 dark:bg-red-950/20";
        case "HIGH": return "border-l-orange-500";
        case "MEDIUM": return "border-l-blue-500";
        case "LOW": return "border-l-gray-300";
        default: return "border-l-transparent";
    }
};

const getColumnTitle = (status: TaskStatus) => {
    switch (status) {
        case TaskStatus.TODO: return "Da Fare";
        case TaskStatus.IN_PROGRESS: return "In Corso";
        case TaskStatus.DONE: return "Completate";
        default: return status;
    }
};

// =====================================
// SOTTO-COMPONENTE: CARD SORTABLE
// =====================================
interface SortableTaskCardProps {
    task: TaskWithRelations;
}

function SortableTaskCard({ task }: SortableTaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { type: "Task", task } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const isDone = task.status === TaskStatus.DONE;
    const isOverdue = task.dueDate && isPast(task.dueDate) && !isToday(task.dueDate) && !isDone;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`w-full group cursor-grab active:cursor-grabbing`}
        >
            <Card className={`relative border-l-4 pr-2 pl-2 shadow-sm hover:shadow-md transition-shadow ${getPriorityColor(task.priority)} ${isDone ? 'opacity-70' : ''}`}>
                <CardContent className="p-3 pt-3 pb-3 flex flex-col gap-2">

                    {/* Header: Titolo e Urgenza */}
                    <div className="flex justify-between items-start gap-2">
                        <p className={`text-sm font-semibold leading-tight ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                        </p>
                        {task.priority === "URGENT" && !isDone && (
                            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-2 mt-1">

                        {/* Data Scadenza */}
                        {task.dueDate && (
                            <span className={`text-[10px] flex items-center gap-1 font-medium ${isOverdue ? 'text-red-500 bg-red-50 px-1 py-0.5 rounded' : 'text-muted-foreground'}`}>
                                <CalendarClock className="h-3 w-3" />
                                {format(task.dueDate, "d MMM", { locale: it })}
                            </span>
                        )}

                        {/* Customer Badge (Initials if tight space, full on wider) */}
                        {task.customer && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                                <User className="mr-0.5 h-2.5 w-2.5" />
                                {task.customer.firstName.charAt(0)}.{task.customer.lastName}
                            </Badge>
                        )}

                        {/* Appointment Badge */}
                        {task.appointment && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal border-blue-200">
                                {format(task.appointment.startTime, "HH:mm")}
                            </Badge>
                        )}

                        <div className="flex-1" />

                        {/* Assignee Avatar */}
                        {task.assignee && (
                            <Avatar className="h-5 w-5 border">
                                <AvatarFallback className="text-[9px]">
                                    {task.assignee.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        )}

                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// =====================================
// SOTTO-COMPONENTE: DROPPABLE COLUMN
// =====================================
function DroppableColumn({ col, children }: { col: { id: string; title: string, tasks: any[] }, children: React.ReactNode }) {
    const { isOver, setNodeRef } = useDroppable({
        id: col.id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`bg-muted/30 p-2 min-h-[500px] rounded-xl flex flex-col gap-3 transition-colors duration-200 ${isOver ? "bg-muted/50 ring-2 ring-primary/20" : ""
                }`}
        >
            <SortableContext items={col.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                {children}
            </SortableContext>
        </div>
    );
}

// =====================================
// COMPONENTE PRINCIPALE: KANBAN BOARD
// =====================================
interface TaskKanbanBoardProps {
    initialTasks: TaskWithRelations[];
}

export function TaskKanbanBoard({ initialTasks }: TaskKanbanBoardProps) {
    const [tasks, setTasks] = useState<TaskWithRelations[]>(initialTasks);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    // DND Drag Overlay State
    const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);

    // Sensori per catturare click/touch
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // evita trascinamenti accidentali su click
        useSensor(KeyboardSensor)
    );

    // DND Handlers
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const task = tasks.find((t) => t.id === active.id);
        if (task) setActiveTask(task);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveTask(null);
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id;
        const overId = over.id; // Può essere un'altra task o direttamente la colonna

        if (activeId === overId) return;

        const activeTaskIndex = tasks.findIndex((t) => t.id === activeId);
        const overTaskIndex = tasks.findIndex((t) => t.id === overId);

        let newStatus: TaskStatus;

        // Se sto droppando sopra una colonna vuota o direttamente sull'ID della colonna
        if (COLUMNS.includes(overId as TaskStatus)) {
            newStatus = overId as TaskStatus;
        } else {
            // Se sto droppando sopra un'altra task, prendo il suo status
            newStatus = tasks[overTaskIndex].status;
        }

        const taskToMove = tasks[activeTaskIndex];

        // Se non cambia status (es. ha solo riordinato nella stessa colonna - che non gestiamo nel backend al momento)
        if (taskToMove.status === newStatus) return;

        // 1. OPTIMISTIC UPDATE: Scatta istantaneamente la UI
        const previousTasks = [...tasks];

        setTasks((prev) =>
            prev.map(t =>
                t.id === activeId ? {
                    ...t,
                    status: newStatus,
                    completedAt: newStatus === TaskStatus.DONE ? new Date() : null
                } : t
            )
        );

        // 2. SERVER ACTION in transizione isolata
        startTransition(async () => {
            try {
                await updateTaskStatus(activeId as string, newStatus);
            } catch (error) {
                // Revert
                setTasks(previousTasks);
                toast({
                    title: "Sincronizzazione fallita",
                    description: "Usa connessione stabile o riprova.",
                    variant: "destructive"
                });
            }
        });
    };

    // Computazione colonne per performance migliori nel render
    const columnsData = useMemo(() => {
        return COLUMNS.map(status => ({
            id: status,
            title: getColumnTitle(status),
            tasks: tasks.filter(t => t.status === status).sort((a, b) => {
                // Ordina in colonna prima gli urgenti, poi quelli con scadenza più vicina
                if (a.priority === "URGENT" && b.priority !== "URGENT") return -1;
                if (a.priority !== "URGENT" && b.priority === "URGENT") return 1;
                if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
                return 0;
            })
        }));
    }, [tasks]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {columnsData.map((col) => (
                    <div key={col.id} className="flex flex-col gap-4">
                        {/* Header Colonna */}
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="font-semibold text-lg">{col.title}</h3>
                            <Badge variant="secondary" className="bg-muted/50 rounded-full">{col.tasks.length}</Badge>
                        </div>

                        {/* Colore di Sfondo Droppabile */}
                        <DroppableColumn col={col}>
                            {col.tasks.map((task) => (
                                <SortableTaskCard key={task.id} task={task} />
                            ))}

                            {/* Area vuota per il drop se la colonna è vuota (invisibile ma intercettabile) */}
                            {col.tasks.length === 0 && (
                                <div className="h-full flex-1 flex items-center justify-center text-sm text-muted-foreground/50 italic border-2 border-dashed border-muted-foreground/20 rounded-lg m-2">
                                    Trascina qui...
                                </div>
                            )}
                        </DroppableColumn>
                    </div>
                ))}
            </div>

            {/* Ghost Element del drag overlay */}
            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }) }}>
                {activeTask ? <SortableTaskCard task={activeTask} /> : null}
            </DragOverlay>
        </DndContext>
    );
}
