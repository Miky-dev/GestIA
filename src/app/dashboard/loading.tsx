export default function DashboardLoading() {
    return (
        <div className="flex-1 space-y-8 p-8 w-full bg-muted/40 min-h-[calc(100vh-4rem)]">
            {/* Header Skeleton */}
            <div className="space-y-2">
                <div className="h-8 w-[250px] bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-[200px] bg-muted animate-pulse rounded-md" />
            </div>

            {/* KPI Cards Row Skeleton */}
            <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="shadow-sm border border-border/50 bg-background rounded-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="h-4 w-1/2 bg-muted animate-pulse rounded-md" />
                            <div className="h-4 w-4 bg-muted animate-pulse rounded-md" />
                        </div>
                        <div className="h-8 w-1/3 bg-muted animate-pulse rounded-md" />
                    </div>
                ))}
            </div>

            {/* Layout a 2 Colonne Skeleton */}
            <div className="grid gap-6 md:grid-cols-10">
                {/* Colonna SX Skeleton */}
                <div className="md:col-span-7">
                    <div className="shadow-sm border border-border/50 bg-background rounded-xl p-6 h-[400px] space-y-4">
                        <div className="h-6 w-1/3 bg-muted animate-pulse rounded-md" />
                        <div className="h-4 w-1/4 bg-muted animate-pulse rounded-md mb-8" />

                        <div className="space-y-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-16 w-full bg-muted animate-pulse rounded-md" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Colonna DX Skeleton */}
                <div className="md:col-span-3 flex flex-col gap-6">
                    <div className="shadow-sm border border-border/50 bg-background rounded-xl p-6 h-[200px] space-y-4">
                        <div className="h-6 w-1/2 bg-muted animate-pulse rounded-md mb-4" />
                        <div className="h-12 w-full bg-muted animate-pulse rounded-md" />
                        <div className="h-12 w-full bg-muted animate-pulse rounded-md" />
                    </div>

                    <div className="shadow-sm border border-border/50 bg-background rounded-xl p-6 flex-1 min-h-[300px] space-y-4">
                        <div className="h-6 w-1/2 bg-muted animate-pulse rounded-md mb-4" />
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-9 w-full bg-muted animate-pulse rounded-md" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
