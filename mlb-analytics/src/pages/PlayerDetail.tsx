import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { getPlayerById } from "../services/mlbApi";
import type { PlayerDetail as PlayerDetailType } from "../types/player";

export default function PlayerDetail() {
    const { id } = useParams();
    const {
        data: player,
        isLoading,
        isError,
    } = useQuery<PlayerDetailType>({
        queryKey: ["player", id],
        queryFn: () => getPlayerById(id!),
        enabled: Boolean(id),
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 p-10 text-slate-950 dark:bg-slate-900 dark:text-white">
                Loading...
            </div>
        );
    }

    if (isError || !player) {
        return (
            <div className="min-h-screen bg-slate-50 p-10 text-slate-950 dark:bg-slate-900 dark:text-white">
                <Link to="/" className="font-bold text-blue-600 dark:text-blue-400">
                    Back to Dashboard
                </Link>
                <p className="mt-8 text-red-500">
                    {isError ? "Failed to load player detail." : "Player not found."}
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-10 text-slate-950 dark:bg-slate-900 dark:text-white">
            <Link to="/" className="font-bold text-blue-600 dark:text-blue-400">
                Back to Dashboard
            </Link>

            <header className="mt-8">
                <p className="text-slate-500 dark:text-gray-400">
                    Position: {player.position || "N/A"}
                </p>
                <h1 className="mt-2 text-5xl font-bold">{player.name}</h1>
            </header>

            <div className="mt-10 grid grid-cols-4 gap-6">
                <Card title="AVG" value={Number(player.avg).toFixed(3)} />
                <Card title="HR" value={String(player.hr)} />
                <Card title="OPS" value={Number(player.ops).toFixed(3)} />
                <Card title="RBI" value={String(player.rbi)} />
                <Card title="ERA" value={Number(player.era || 0).toFixed(2)} />
                <Card title="WHIP" value={Number(player.whip || 0).toFixed(2)} />
                <Card title="SO" value={String(player.strikeouts || 0)} />
                <Card
                    title="W-L"
                    value={`${player.wins || 0}-${player.losses || 0}`}
                />
            </div>

            <section className="mt-10 h-96 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h2 className="mb-6 text-2xl font-bold">Career Home Runs</h2>

                <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={player.seasons || []}>
                        <XAxis dataKey="season" />
                        <YAxis />
                        <Tooltip />
                        <Line dataKey="hr" stroke="#2563eb" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </section>

            <section className="mt-10 h-96 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h2 className="mb-6 text-2xl font-bold">Career Strikeouts</h2>

                <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={player.pitchingSeasons || []}>
                        <XAxis dataKey="season" />
                        <YAxis />
                        <Tooltip />
                        <Line
                            dataKey="strikeouts"
                            stroke="#16a34a"
                            strokeWidth={2}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </section>
        </div>
    );
}

function Card({ title, value }: { title: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-slate-500 dark:text-gray-400">{title}</p>
            <h3 className="text-4xl font-bold">{value}</h3>
        </div>
    );
}
