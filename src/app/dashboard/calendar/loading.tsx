export default function CalendarLoading() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6 w-full">
            <div className="flex items-center justify-between space-y-2 mb-4">
                <div className="space-y-2">
                    <div className="h-9 w-[200px] bg-muted animate-pulse rounded-md" />
                    <div className="h-4 w-[300px] bg-muted animate-pulse rounded-md" />
                </div>
                <div className="h-10 w-[150px] bg-muted animate-pulse rounded-md" />
            </div>

            <div className="shadow-sm border border-border/50 bg-background rounded-xl p-6 mt-4">
                {/* Header Calendario */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-2">
                        <div className="h-9 w-10 bg-muted animate-pulse rounded-md" />
                        <div className="h-9 w-10 bg-muted animate-pulse rounded-md" />
                        <div className="h-9 w-[120px] bg-muted animate-pulse rounded-md" />
                    </div>
                    <div className="h-8 w-[200px] bg-muted animate-pulse rounded-md" />
                    <div className="flex gap-2">
                        <div className="h-9 w-[100px] bg-muted animate-pulse rounded-md" />
                        <div className="h-9 w-[100px] bg-muted animate-pulse rounded-md" />
                        <div className="h-9 w-[100px] bg-muted animate-pulse rounded-md" />
                    </div>
                </div>

                {/* Griglia Calendario Skeleton */}
                <div className="h-[700px] w-full bg-muted/50 animate-pulse rounded-lg border border-border" />
            </div>
        </div>
    );
}
