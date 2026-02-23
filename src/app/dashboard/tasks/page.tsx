import { getTasks } from "@/actions/tasks";
import { TasksClient } from "@/components/tasks/TasksClient";

export const metadata = {
    title: "Attività - GestIA",
    description: "Gestione delle attività del personale aziendale",
};

export default async function TasksPage() {
    // 1. Fetch dei task (Server Side) limitato al tenant attuale
    const tasks = await getTasks();

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <TasksClient initialTasks={tasks} />
        </div>
    );
}
