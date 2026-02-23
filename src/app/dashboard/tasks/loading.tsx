export default function TasksLoading() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="space-y-8 max-w-6xl mx-auto w-full">
                {/* Header & Tabs Skeleton */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                    <div className="space-y-2">
                        <div className="h-9 w-[150px] bg-muted animate-pulse rounded-md" />
                        <div className="h-4 w-[250px] bg-muted animate-pulse rounded-md" />
                    </div>
                    <div className="h-10 w-[400px] bg-muted animate-pulse rounded-md" />
                </div>

                {/* Input form skeleton */}
                <div className="h-12 w-full bg-muted animate-pulse rounded-md mb-6" />

                {/* KPI Skeleton */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="shadow-sm border border-border/50 bg-background rounded-xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="h-4 w-1/2 bg-muted animate-pulse rounded-md" />
                                <div className="h-4 w-4 bg-muted animate-pulse rounded-md" />
                            </div>
                            <div className="h-8 w-1/4 bg-muted animate-pulse rounded-md" />
                        </div>
                    ))}
                </div>

                {/* Columns Skeleton */}
                <div className="grid gap-8 grid-cols-1 md:grid-cols-3 mt-8">
                    {[...Array(3)].map((_, colIndex) => (
                        <div key={colIndex} className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <div className="h-6 w-24 bg-muted animate-pulse rounded-md" />
                                <div className="h-5 w-8 bg-muted animate-pulse rounded-full" />
                            </div>
                            <div className="flex flex-col gap-3">
                                {[...Array(4)].map((_, taskIndex) => (
                                    <div key={taskIndex} className="h-24 w-full bg-muted animate-pulse rounded-xl" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
