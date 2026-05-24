import { Link } from "react-router-dom";
import type { Player } from "../../types/player";

export default function PlayerTable({ players }: { players: Player[] }) {
    return (
        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-6 text-2xl font-bold">Player Stats</h3>

            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-gray-400">
                        <th className="pb-3">Player</th>
                        <th className="pb-3">Team</th>
                        <th className="pb-3">Position</th>
                        <th className="pb-3">Season</th>
                        <th className="pb-3">AVG</th>
                        <th className="pb-3">HR</th>
                        <th className="pb-3">OPS</th>
                        <th className="pb-3">RBI</th>
                        <th className="pb-3">ERA</th>
                        <th className="pb-3">WHIP</th>
                        <th className="pb-3">SO</th>
                        <th className="pb-3">W-L</th>
                    </tr>
                </thead>

                <tbody>
                    {players.map((player) => (
                        <tr key={player.id} className="border-b border-slate-200 dark:border-slate-700">
                            <td className="py-4">
                                <Link
                                    to={`/player/${player.id}`}
                                    className="font-bold text-blue-600 dark:text-blue-400"
                                >
                                    {player.name}
                                </Link>
                            </td>
                            <td>
                                {player.team_id || player.teamId ? (
                                    <Link
                                        to={`/team/${player.team_id || player.teamId}`}
                                        className="font-bold text-blue-600 dark:text-blue-400"
                                    >
                                        {player.team}
                                    </Link>
                                ) : (
                                    player.team
                                )}
                            </td>
                            <td>{player.position || "N/A"}</td>
                            <td>{player.season || "N/A"}</td>
                            <td>{player.avg}</td>
                            <td>{player.hr}</td>
                            <td>{player.ops}</td>
                            <td>{player.rbi}</td>
                            <td>{Number(player.era || 0).toFixed(2)}</td>
                            <td>{Number(player.whip || 0).toFixed(2)}</td>
                            <td>{player.strikeouts || 0}</td>
                            <td>
                                {player.wins || 0}-{player.losses || 0}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
