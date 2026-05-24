import KPISection from "../components/players/KPISection";
import HRChart from "../components/charts/HRChart";
import ERAChart from "../components/charts/ERAChart";
import PlayerTable from "../components/players/PlayerTable";

import { usePlayersQuery, useRefreshPlayers } from "../hooks/usePlayersQuery";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "../hooks/useDebounce";
import PlayerTableSkeleton from "../components/players/PlayerTableSkeleton";
import EmptyState from "../components/players/EmptyState";
import toast from "react-hot-toast";
import { useTheme } from "../hooks/useTheme";

export default function Dashboard() {
    const { dark, setDark } = useTheme();
    const [searchParams, setSearchParams] = useSearchParams();
    const sort = searchParams.get("sort") || "hr";

    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const team = searchParams.get("team") || "All";
    const position = searchParams.get("position") || "All";
    const search = searchParams.get("search") || "";
    const debouncedSearch = useDebounce(search, 500);
    function changePage(newPage: number) {
        setSearchParams({
            page: String(newPage),

            sort,

            team,

            position,

            search: debouncedSearch,

            limit: String(limit),
        });
    }
    function changeSearch(newSearch: string) {
        setSearchParams({
            page: "1",
            sort,
            team,
            position,
            search: newSearch,
        });
    }
    function changeSort(newSort: string) {
        setSearchParams({
            page: "1",
            sort: newSort,
            team,
            position,
        });
    }
    function changeTeam(newTeam: string) {
        setSearchParams({
            page: "1",
            sort,
            team: newTeam,
            position,
        });
    }
    function changePosition(newPosition: string) {
        setSearchParams({
            page: "1",
            sort,
            team,
            position: newPosition,
            search,
            limit: String(limit),
        });
    }

    const { data, isLoading, isError, isFetching } = usePlayersQuery(
        page,
        limit,
        sort,
        team,
        position,
        debouncedSearch,
    );
    const players = data?.players || [];
    const teams: string[] = ["All", ...(data?.teams || [])];
    const positions: string[] = ["All", ...(data?.positions || [])];
    const refreshPlayers = useRefreshPlayers();
    const total = data?.total || 0;
    const totalPages = Math.ceil(total / limit);
    function changeLimit(newLimit: number) {
        setSearchParams({
            page: "1",

            sort,

            team,

            position,

            search,

            limit: String(newLimit),
        });
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 text-white p-10">
                Loading...
            </div>
        );
    }
    if (isError) {
        return (
            <div className="min-h-screen bg-slate-900 text-white p-10">
                <h1 className="text-3xl font-bold text-red-400">
                    Failed to load MLB data
                </h1>

                <p className="mt-4 text-gray-300">
                    Please check if the backend API URL is configured correctly.
                </p>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-slate-50 p-10 text-slate-950 dark:bg-slate-900 dark:text-white">
            <h1 className="text-3xl font-bold">MLB Dashboard</h1>
            {isFetching && (
                <div
                    className="mb-4 text-blue-600 dark:text-blue-400"
                >
                    Updating...
                </div>
            )}
            <button
                onClick={() =>
                    refreshPlayers.mutate(undefined, {
                        onSuccess: () =>
                            toast.success("Data refreshed successfully"),
                        onError: () => toast.error("Failed to refresh data"),
                    })
                }
                disabled={refreshPlayers.isPending}
                className="mt-6 mb-4 rounded-lg bg-blue-600 px-5 py-3 font-bold disabled:opacity-50"
            >
                {refreshPlayers.isPending ? "Updating..." : "Refresh Data"}
            </button>
            <button
                onClick={() => setDark(!dark)}
                className="ml-4 rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-700 dark:text-white"
            >
                {dark ? "Light mode" : "Dark mode"}
            </button>

            <KPISection
                players={players}
                totalPlayers={total}
                teamCount={teams.length - 1}
            />
            <HRChart players={players} />
            <ERAChart players={players} />
            <select
                value={sort}
                onChange={(e) => changeSort(e.target.value)}
                className="mt-6 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
                <option value="hr">HR</option>
                <option value="avg">AVG</option>
                <option value="ops">OPS</option>
                <option value="rbi">RBI</option>
                <option value="era">ERA</option>
                <option value="whip">WHIP</option>
                <option value="strikeouts">SO</option>
                <option value="wins">Wins</option>
            </select>
            <select
                value={team}
                onChange={(e) => changeTeam(e.target.value)}
                className="ml-4 mt-6 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
                {teams.map((t: string) => (
                    <option key={t} value={t}>
                        {t}
                    </option>
                ))}
            </select>
            <select
                value={position}
                onChange={(e) => changePosition(e.target.value)}
                className="ml-4 mt-6 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
                {positions.map((item: string) => (
                    <option key={item} value={item}>
                        {item === "All" ? "All Positions" : item}
                    </option>
                ))}
            </select>

            <input
                value={search}
                onChange={(e) => changeSearch(e.target.value)}
                placeholder="Search player..."
                className="mt-6 ml-4 mr-4 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <select
                value={limit}
                onChange={(e) => changeLimit(Number(e.target.value))}
                className="ml-4 rounded border border-slate-300 bg-white px-4 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
                <option value={10}>10</option>

                <option value={20}>20</option>

                <option value={50}>50</option>
            </select>
            <p className="mt-4 text-slate-500 dark:text-gray-400">
                Found {total} players
            </p>
            {isLoading ? (
                <PlayerTableSkeleton />
            ) : players.length === 0 ? (
                <EmptyState
                    title="No players found"
                    description="Try adjusting your search or filter criteria."
                />
            ) : (
                <PlayerTable players={players} />
            )}
            <div
                className="mt-8 flex gap-4"
            >
                <button
                    onClick={() => changePage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="rounded bg-slate-200 px-4 py-2 text-slate-900 disabled:opacity-50 dark:bg-slate-700 dark:text-white"
                >
                    Prev
                </button>

                <span>
                    Page {page} / {totalPages}
                </span>

                <button
                    onClick={() => changePage(page + 1)}
                    disabled={page >= totalPages}
                    className="rounded bg-slate-200 px-4 py-2 text-slate-900 disabled:opacity-50 dark:bg-slate-700 dark:text-white"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
