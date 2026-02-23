export default function CustomersLoading() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6 w-full">
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <div className="h-9 w-[200px] bg-muted animate-pulse rounded-md mb-2" />
                    <div className="h-4 w-[300px] bg-muted animate-pulse rounded-md" />
                </div>
                <div className="h-10 w-[150px] bg-muted animate-pulse rounded-md" />
            </div>

            <div className="block">
                {/* Toolbar */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="h-10 w-[300px] bg-muted animate-pulse rounded-md" />
                    <div className="h-10 w-[100px] ml-auto bg-muted animate-pulse rounded-md" />
                </div>

                {/* Tabella Skeleton */}
                <div className="border rounded-md bg-background overflow-hidden">
                    {/* Intestazione riga */}
                    <div className="h-12 w-full bg-muted/50 border-b flex items-center px-4 gap-4">
                        <div className="h-4 w-1/4 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-1/4 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-1/4 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-1/4 bg-muted animate-pulse rounded" />
                    </div>

                    {/* Righe corpo tabella */}
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className="h-16 w-full border-b flex items-center px-4 gap-4 last:border-0">
                            <div className="h-4 w-1/4 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-1/4 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-1/4 bg-muted animate-pulse rounded" />
                            <div className="h-8 w-8 ml-auto bg-muted animate-pulse rounded-full" />
                        </div>
                    ))}
                </div>

                {/* Paginazione */}
                <div className="flex items-center justify-end mt-4">
                    <div className="h-8 w-[250px] bg-muted animate-pulse rounded-md" />
                </div>
            </div>
        </div>
    );
}
