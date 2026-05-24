const API_BASE_URL =
    import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
    "http://localhost:5000";

export async function getPlayers(
    page = 1,
    limit = 10,
    refresh = false,
    sort = "hr",
    team = "All",
    position = "All",
    search = "",
    sourceLimit = 10000,
) {
    const refreshParams = refresh
        ? `&refresh=true&sourceLimit=${sourceLimit}`
        : "";

    const res = await fetch(
        `${API_BASE_URL}/api/players?page=${page}&limit=${limit}&sort=${sort}&team=${encodeURIComponent(
            team,
        )}&position=${encodeURIComponent(position)}&search=${encodeURIComponent(search)}${refreshParams}`,
    );

    if (!res.ok) throw new Error("Failed to fetch players");

    return res.json();
}
export async function getPlayerById(id: string) {
    const res = await fetch(`${API_BASE_URL}/api/players/${id}`);

    if (!res.ok) {
        throw new Error("Failed to fetch player");
    }

    return res.json();
}

export async function getTeamById(id: string) {
    const res = await fetch(`${API_BASE_URL}/api/teams/${id}`);

    if (!res.ok) {
        throw new Error("Failed to fetch team");
    }

    return res.json();
}
