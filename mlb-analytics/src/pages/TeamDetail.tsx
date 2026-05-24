import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { getTeamById } from "../services/mlbApi";
import type { TeamDetail as TeamDetailType, TeamGame } from "../types/player";

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(value));
}

function formatDecimal(value: number) {
    return value.toFixed(3).replace(/^0/, "");
}

function getMonthlyWinRates(games: TeamGame[]) {
    const monthly = new Map<string, { wins: number; games: number; order: number }>();

    for (const game of games) {
        if (game.result !== "W" && game.result !== "L") continue;

        const date = new Date(game.date);
        const month = new Intl.DateTimeFormat("en-US", {
            month: "short",
        }).format(date);
        const current = monthly.get(month) || {
            wins: 0,
            games: 0,
            order: date.getMonth(),
        };

        monthly.set(month, {
            wins: current.wins + (game.result === "W" ? 1 : 0),
            games: current.games + 1,
            order: current.order,
        });
    }

    return Array.from(monthly.entries())
        .map(([month, value]) => ({
            month,
            order: value.order,
            winRate: Math.round((value.wins / value.games) * 100),
            record: `${value.wins}-${value.games - value.wins}`,
        }))
        .sort((a, b) => a.order - b.order);
}

export default function TeamDetail() {
    const { id } = useParams();
    const {
        data: team,
        isLoading,
        isError,
    } = useQuery<TeamDetailType>({
        queryKey: ["team", id],
        queryFn: () => getTeamById(id!),
        enabled: Boolean(id),
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 p-10 text-slate-950 dark:bg-slate-900 dark:text-white">
                Loading...
            </div>
        );
    }

    if (isError || !team) {
        return (
            <div className="min-h-screen bg-slate-50 p-10 text-slate-950 dark:bg-slate-900 dark:text-white">
                <Link to="/" className="font-bold text-blue-600 dark:text-blue-400">
                    Back to Dashboard
                </Link>
                <p className="mt-8 text-red-500">Failed to load team detail.</p>
            </div>
        );
    }

    const monthlyWinRates = getMonthlyWinRates(team.games);

    return (
        <div className="min-h-screen bg-slate-50 p-10 text-slate-950 dark:bg-slate-900 dark:text-white">
            <Link to="/" className="font-bold text-blue-600 dark:text-blue-400">
                Back to Dashboard
            </Link>

            <header className="mt-8">
                <p className="text-slate-500 dark:text-gray-400">
                    {team.league} / {team.division} / {team.venue}
                </p>
                <h1 className="mt-2 text-5xl font-bold">{team.name}</h1>
            </header>

            <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-7">
                <Card title="Runs" value={String(team.stats.runs)} />
                <Card title="HR" value={String(team.stats.homeRuns)} />
                <Card title="AVG" value={formatDecimal(team.stats.avg)} />
                <Card title="OPS" value={formatDecimal(team.stats.ops)} />
                <Card title="ERA" value={team.stats.era.toFixed(2)} />
                <Card title="SO" value={String(team.stats.strikeOuts)} />
                <Card title="WHIP" value={team.stats.whip.toFixed(2)} />
            </section>

            <section className="mt-10 h-96 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h2 className="mb-6 text-2xl font-bold">Monthly Win Rate</h2>

                {monthlyWinRates.length === 0 ? (
                    <p className="text-slate-500 dark:text-gray-400">
                        No completed games available for monthly win rate.
                    </p>
                ) : (
                    <ResponsiveContainer width="100%" height="85%">
                        <BarChart
                            data={monthlyWinRates}
                            margin={{ top: 8, right: 24, bottom: 24, left: 8 }}
                        >
                            <XAxis dataKey="month" />
                            <YAxis
                                domain={[0, 100]}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip
                                formatter={(value, _name, item) => [
                                    `${value}% (${item.payload.record})`,
                                    "Win rate",
                                ]}
                            />
                            <Bar dataKey="winRate" fill="#2563eb" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </section>

            <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h2 className="mb-6 text-2xl font-bold">
                    {team.season} Game History
                </h2>

                <div className="max-h-[620px] overflow-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-gray-400">
                                <th className="pb-3">Date</th>
                                <th className="pb-3">Opponent</th>
                                <th className="pb-3">Home/Away</th>
                                <th className="pb-3">Score</th>
                                <th className="pb-3">Result</th>
                                <th className="pb-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {team.games.map((game) => (
                                <tr
                                    key={game.id}
                                    className="border-b border-slate-200 dark:border-slate-700"
                                >
                                    <td className="py-4">{formatDate(game.date)}</td>
                                    <td>{game.opponent}</td>
                                    <td>{game.homeAway}</td>
                                    <td>
                                        {game.teamScore === null ||
                                        game.opponentScore === null
                                            ? "-"
                                            : `${game.teamScore}-${game.opponentScore}`}
                                    </td>
                                    <td>{game.result}</td>
                                    <td>{game.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function Card({ title, value }: { title: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-slate-500 dark:text-gray-400">{title}</p>
            <h3 className="text-3xl font-bold">{value}</h3>
        </div>
    );
}
