export default function PlayerTableSkeleton() {
    return (
        <div className="mt-10 animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-6 h-8 w-48 rounded bg-slate-200 dark:bg-slate-700" />

            {Array.from({ length: 8 }).map((_, index) => (
                <div
                    key={index}
                    className="mb-4 h-10 rounded bg-slate-200 dark:bg-slate-700"
                />
            ))}
        </div>
    );
}
