import type { Player } from "../../types/player";

type KPISectionProps = {
    players: Player[];
    totalPlayers: number;
    teamCount: number;
};

function formatDecimal(value: number) {
    return value.toFixed(3).replace(/^0/, "");
}

export default function KPISection({
    players,
    totalPlayers,
    teamCount,
}: KPISectionProps) {
    const topHr = Math.max(...players.map((player) => player.hr), 0);
    const topRbi = Math.max(...players.map((player) => player.rbi), 0);
    const bestAvg = Math.max(...players.map((player) => Number(player.avg)), 0);
    const bestOps = Math.max(...players.map((player) => Number(player.ops)), 0);
    const topStrikeouts = Math.max(
        ...players.map((player) => Number(player.strikeouts || 0)),
        0,
    );
    const qualifiedEras = players
        .map((player) => Number(player.era || 0))
        .filter((era) => era > 0);
    const bestEra = qualifiedEras.length ? Math.min(...qualifiedEras) : 0;

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-8">
            <Card title="Players" value={String(totalPlayers)} />
            <Card title="Teams" value={String(teamCount)} />
            <Card title="Top HR" value={String(topHr)} />
            <Card title="Most RBI" value={String(topRbi)} />
            <Card title="Best AVG" value={formatDecimal(bestAvg)} />
            <Card title="Best OPS" value={formatDecimal(bestOps)} />
            <Card title="Top SO" value={String(topStrikeouts)} />
            <Card title="Best ERA" value={bestEra.toFixed(2)} />
        </div>
    );
}

function Card({ title, value }: { title: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-slate-500 dark:text-gray-400">{title}</p>
            <h2 className="text-3xl font-bold text-slate-950 dark:text-white">
                {value}
            </h2>
        </div>
    );
}
