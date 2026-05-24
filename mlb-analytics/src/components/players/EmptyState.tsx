export default function EmptyState({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-6 text-5xl font-black text-blue-600 dark:text-blue-400">
                MLB
            </div>

            <h2 className="text-3xl font-bold text-slate-950 dark:text-white">
                {title}
            </h2>

            <p className="mt-4 text-slate-500 dark:text-gray-400">
                {description}
            </p>
        </div>
    );
}
