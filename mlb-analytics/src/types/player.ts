export type Player = {
    id: number;
    name: string;
    team: string;
    team_id?: number;
    teamId?: number;
    position?: string;
    season?: number;
    avg: number;
    hr: number;
    ops: number;
    rbi: number;
    era?: number;
    whip?: number;
    strikeouts?: number;
    wins?: number;
    losses?: number;
};

export type PlayerSeason = {
    season: string;
    hr: number;
    avg: number;
    ops: number;
    rbi: number;
};

export type PitchingSeason = {
    season: string;
    era: number;
    whip: number;
    strikeouts: number;
    wins: number;
    losses: number;
};

export type PlayerDetail = Player & {
    seasons: PlayerSeason[];
    pitchingSeasons: PitchingSeason[];
};

export type TeamGame = {
    id: number;
    date: string;
    status: string;
    opponent: string;
    homeAway: string;
    teamScore: number | null;
    opponentScore: number | null;
    result: string;
};

export type TeamDetail = {
    id: number;
    name: string;
    venue: string;
    division: string;
    league: string;
    season: number;
    stats: {
        runs: number;
        homeRuns: number;
        avg: number;
        ops: number;
        era: number;
        strikeOuts: number;
        whip: number;
    };
    games: TeamGame[];
};
