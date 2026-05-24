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

export default function HRChart({ players }: { players: Player[] }) {
    const chartWidth = Math.max(players.length * 96, 900);

    return (
        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-6 text-2xl font-bold">Home Runs Comparison</h2>

            <div className="w-full max-w-full overflow-x-auto pb-3">
                <div className="h-[500px]" style={{ width: chartWidth }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={players}
                            margin={{ top: 8, right: 24, bottom: 72, left: 8 }}
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
                            <Bar dataKey="hr" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
