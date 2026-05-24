import {
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { Player } from "../../types/player";

function formatAxisName(name: string) {
    const parts = name.split(" ");
    const lastName = parts.at(-1) ?? name;
    const firstInitial = parts[0]?.[0] ? `${parts[0][0]}.` : "";

    return `${firstInitial} ${lastName}`.trim();
}

export default function ERAChart({ players }: { players: Player[] }) {
    const pitchers = players.filter((player) => Number(player.era || 0) > 0);
    const chartWidth = Math.max(pitchers.length * 96, 900);

    return (
        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-6 text-2xl font-bold">ERA Comparison</h2>

            {pitchers.length === 0 ? (
                <p className="text-slate-500 dark:text-gray-400">
                    No pitcher ERA data available for the current page.
                </p>
            ) : (
                <div className="w-full max-w-full overflow-x-auto pb-3">
                    <div className="h-[420px]" style={{ width: chartWidth }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={pitchers}
                                margin={{
                                    top: 8,
                                    right: 24,
                                    bottom: 72,
                                    left: 8,
                                }}
                            >
                                <XAxis
                                    dataKey="name"
                                    angle={-35}
                                    textAnchor="end"
                                    interval={0}
                                    height={100}
                                    tickFormatter={formatAxisName}
                                />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="era" fill="#16a34a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
