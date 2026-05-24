import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPlayers } from "../services/mlbApi";

export function usePlayersQuery(
    page: number,
    limit: number,
    sort: string,
    team: string,
    position: string,
    search: string,
) {
    return useQuery({
        queryKey: ["players", page, limit, sort, team, position, search],
        queryFn: () =>
            getPlayers(page, limit, false, sort, team, position, search),
        staleTime: 1000 * 60 * 10,
        placeholderData: (previousData) => previousData,
    });
}

export function useRefreshPlayers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () =>
            getPlayers(1, 10, true, "hr", "All", "All", "", 10000),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["players"] });
        },
    });
}
