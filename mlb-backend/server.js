require("dotenv").config();
const pool = require("./db");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = 5000;
const DEFAULT_SOURCE_LIMIT = 10000;
const MAX_SOURCE_LIMIT = 10000;
const CURRENT_SEASON =
    Number(process.env.MLB_SEASON) || new Date().getFullYear();

async function ensureSchema() {
    await pool.query(`
CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    venue TEXT,
    division TEXT,
    league TEXT,
    season INTEGER,
    runs INTEGER NOT NULL DEFAULT 0,
    home_runs INTEGER NOT NULL DEFAULT 0,
    avg NUMERIC(6, 3) NOT NULL DEFAULT 0,
    ops NUMERIC(6, 3) NOT NULL DEFAULT 0,
    era NUMERIC(6, 2) NOT NULL DEFAULT 0,
    strikeouts INTEGER NOT NULL DEFAULT 0,
    whip NUMERIC(6, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`);
    await pool.query(`
DO $$
BEGIN
    IF to_regclass('team_games') IS NOT NULL
        AND NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'team_games'
            AND column_name = 'team_id'
        )
    THEN
        DROP TABLE team_games;
    END IF;
END $$;
`);
    await pool.query(`
CREATE TABLE IF NOT EXISTS team_games (
    id INTEGER,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    season INTEGER,
    game_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'Unknown',
    opponent TEXT NOT NULL,
    home_away TEXT NOT NULL,
    team_score INTEGER,
    opponent_score INTEGER,
    result TEXT NOT NULL DEFAULT '-',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, team_id)
)
`);
    await pool.query(`
ALTER TABLE team_games
ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE
`);
    await pool.query(`
DELETE FROM team_games
WHERE team_id IS NULL
`);
    await pool.query(`
ALTER TABLE team_games
ALTER COLUMN team_id SET NOT NULL
`);
    await pool.query(`
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'team_games_pkey'
        AND conrelid = 'team_games'::regclass
        AND pg_get_constraintdef(oid) = 'PRIMARY KEY (id)'
    ) THEN
        ALTER TABLE team_games DROP CONSTRAINT team_games_pkey;
        ALTER TABLE team_games ADD PRIMARY KEY (id, team_id);
    END IF;
END $$;
`);
    await pool.query(`
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    team TEXT NOT NULL DEFAULT 'Unknown',
    team_id INTEGER,
    position TEXT,
    season INTEGER,
    avg NUMERIC(6, 3) NOT NULL DEFAULT 0,
    hr INTEGER NOT NULL DEFAULT 0,
    rbi INTEGER NOT NULL DEFAULT 0,
    ops NUMERIC(6, 3) NOT NULL DEFAULT 0,
    era NUMERIC(6, 2) NOT NULL DEFAULT 0,
    whip NUMERIC(6, 2) NOT NULL DEFAULT 0,
    strikeouts INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`);
    await pool.query(`
ALTER TABLE players
ADD COLUMN IF NOT EXISTS team_id INTEGER
`);
    await pool.query(`
ALTER TABLE players
ADD COLUMN IF NOT EXISTS position TEXT
`);
    await pool.query(`
ALTER TABLE players
ADD COLUMN IF NOT EXISTS season INTEGER
`);
    await pool.query(`
ALTER TABLE players
ADD COLUMN IF NOT EXISTS avg NUMERIC(6, 3) NOT NULL DEFAULT 0
`);
    await pool.query(`
ALTER TABLE players
ADD COLUMN IF NOT EXISTS hr INTEGER NOT NULL DEFAULT 0
`);
    await pool.query(`
ALTER TABLE players
ADD COLUMN IF NOT EXISTS rbi INTEGER NOT NULL DEFAULT 0
`);
    await pool.query(`
ALTER TABLE players
ADD COLUMN IF NOT EXISTS ops NUMERIC(6, 3) NOT NULL DEFAULT 0
`);
    await pool.query(`
ALTER TABLE players
ADD COLUMN IF NOT EXISTS era NUMERIC(6, 2) NOT NULL DEFAULT 0
`);
    await pool.query(`
ALTER TABLE players
ADD COLUMN IF NOT EXISTS whip NUMERIC(6, 2) NOT NULL DEFAULT 0
`);
    await pool.query(`
ALTER TABLE players
ADD COLUMN IF NOT EXISTS strikeouts INTEGER NOT NULL DEFAULT 0
`);
    await pool.query(`
ALTER TABLE players
ADD COLUMN IF NOT EXISTS wins INTEGER NOT NULL DEFAULT 0
`);
    await pool.query(`
ALTER TABLE players
ADD COLUMN IF NOT EXISTS losses INTEGER NOT NULL DEFAULT 0
`);
    await pool.query(`
CREATE INDEX IF NOT EXISTS idx_players_team
ON players (team)
`);
    await pool.query(`
CREATE INDEX IF NOT EXISTS idx_players_position
ON players (position)
`);
    await pool.query(`
CREATE INDEX IF NOT EXISTS idx_players_updated_at
ON players (updated_at)
`);
    await pool.query(`
CREATE INDEX IF NOT EXISTS idx_players_team_id
ON players (team_id)
`);
    await pool.query(`
CREATE INDEX IF NOT EXISTS idx_players_name_lower
ON players (LOWER(name))
`);
    await pool.query(`
CREATE INDEX IF NOT EXISTS idx_players_hr
ON players (hr DESC)
`);
    await pool.query(`
CREATE INDEX IF NOT EXISTS idx_players_avg
ON players (avg DESC)
`);
    await pool.query(`
CREATE INDEX IF NOT EXISTS idx_players_ops
ON players (ops DESC)
`);
    await pool.query(`
CREATE INDEX IF NOT EXISTS idx_players_rbi
ON players (rbi DESC)
`);
    await pool.query(`
CREATE INDEX IF NOT EXISTS idx_players_era
ON players (era DESC)
`);
    await pool.query(`
CREATE INDEX IF NOT EXISTS idx_players_whip
ON players (whip DESC)
`);
    await pool.query(`
CREATE INDEX IF NOT EXISTS idx_players_strikeouts
ON players (strikeouts DESC)
`);
    await pool.query(`
CREATE INDEX IF NOT EXISTS idx_players_wins
ON players (wins DESC)
`);
    await pool.query(`
CREATE INDEX IF NOT EXISTS idx_teams_updated_at
ON teams (updated_at)
`);
    await pool.query(`
CREATE INDEX IF NOT EXISTS idx_team_games_team_season
ON team_games (team_id, season)
`);
}

function getPositiveNumber(value, fallback) {
    const parsed = Number(value);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function inningsToDecimal(value) {
    const [whole = "0", outs = "0"] = String(value || "0").split(".");

    return Number(whole) + Number(outs) / 3;
}

async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
}

async function getPlayerStats(player) {
    const basePlayer = {
        id: player.id,
        name: player.fullName,
        season: CURRENT_SEASON,
        avg: 0,
        hr: 0,
        rbi: 0,
        ops: 0,
        era: 0,
        whip: 0,
        strikeouts: 0,
        wins: 0,
        losses: 0,
        team: "Unknown",
        teamId: player.currentTeam?.id || null,
        position: player.primaryPosition?.abbreviation || "N/A",
    };

    try {
        const statsData = await fetchJson(
            `https://statsapi.mlb.com/api/v1/people/${player.id}/stats?stats=season&group=hitting&season=${CURRENT_SEASON}`,
        );
        const splits = statsData.stats?.[0]?.splits || [];
        const totals = splits.reduce(
            (sum, split) => {
                const stat = split.stat || {};

                return {
                    atBats: sum.atBats + (Number(stat.atBats) || 0),
                    hits: sum.hits + (Number(stat.hits) || 0),
                    homeRuns: sum.homeRuns + (Number(stat.homeRuns) || 0),
                    rbi: sum.rbi + (Number(stat.rbi) || 0),
                    totalBases: sum.totalBases + (Number(stat.totalBases) || 0),
                    baseOnBalls:
                        sum.baseOnBalls + (Number(stat.baseOnBalls) || 0),
                    hitByPitch: sum.hitByPitch + (Number(stat.hitByPitch) || 0),
                    sacFlies: sum.sacFlies + (Number(stat.sacFlies) || 0),
                };
            },
            {
                atBats: 0,
                hits: 0,
                homeRuns: 0,
                rbi: 0,
                totalBases: 0,
                baseOnBalls: 0,
                hitByPitch: 0,
                sacFlies: 0,
            },
        );
        const plateAppearancesForObp =
            totals.atBats +
            totals.baseOnBalls +
            totals.hitByPitch +
            totals.sacFlies;
        const obp =
            plateAppearancesForObp > 0
                ? (totals.hits + totals.baseOnBalls + totals.hitByPitch) /
                  plateAppearancesForObp
                : 0;
        const slg = totals.atBats > 0 ? totals.totalBases / totals.atBats : 0;
        const latestSplit = splits.at(-1);

        basePlayer.avg = totals.atBats > 0 ? totals.hits / totals.atBats : 0;
        basePlayer.hr = totals.homeRuns;
        basePlayer.rbi = totals.rbi;
        basePlayer.ops = obp + slg;
        basePlayer.team = latestSplit?.team?.name || basePlayer.team;
    } catch {
        // Keep the player even when season stats are unavailable.
    }

    try {
        const pitchingData = await fetchJson(
            `https://statsapi.mlb.com/api/v1/people/${player.id}/stats?stats=season&group=pitching&season=${CURRENT_SEASON}`,
        );
        const splits = pitchingData.stats?.[0]?.splits || [];
        const totals = splits.reduce(
            (sum, split) => {
                const stat = split.stat || {};

                return {
                    inningsPitched:
                        sum.inningsPitched +
                        inningsToDecimal(stat.inningsPitched),
                    earnedRuns: sum.earnedRuns + (Number(stat.earnedRuns) || 0),
                    walks: sum.walks + (Number(stat.baseOnBalls) || 0),
                    hits: sum.hits + (Number(stat.hits) || 0),
                    strikeouts: sum.strikeouts + (Number(stat.strikeOuts) || 0),
                    wins: sum.wins + (Number(stat.wins) || 0),
                    losses: sum.losses + (Number(stat.losses) || 0),
                };
            },
            {
                inningsPitched: 0,
                earnedRuns: 0,
                walks: 0,
                hits: 0,
                strikeouts: 0,
                wins: 0,
                losses: 0,
            },
        );

        basePlayer.era =
            totals.inningsPitched > 0
                ? (totals.earnedRuns * 9) / totals.inningsPitched
                : 0;
        basePlayer.whip =
            totals.inningsPitched > 0
                ? (totals.walks + totals.hits) / totals.inningsPitched
                : 0;
        basePlayer.strikeouts = totals.strikeouts;
        basePlayer.wins = totals.wins;
        basePlayer.losses = totals.losses;
    } catch {
        // Keep pitching stats at zero for non-pitchers or unavailable stats.
    }

    if (player.currentTeam?.id) {
        try {
            const teamData = await fetchJson(
                `https://statsapi.mlb.com/api/v1/teams/${player.currentTeam.id}`,
            );

            basePlayer.team = teamData.teams?.[0]?.name || "Unknown";
        } catch {
            // Keep Unknown when team lookup fails.
        }
    }

    return basePlayer;
}

async function getPlayerPage({
    sortColumn,
    team,
    position,
    search,
    limit,
    offset,
}) {
    const players = await pool.query(
        `
SELECT *
FROM players
WHERE ($3 = 'All' OR team = $3)

AND ($4 = 'All' OR position = $4)

AND LOWER(name)
LIKE LOWER($5)

ORDER BY ${sortColumn} DESC

LIMIT $1
OFFSET $2
`,
        [limit, offset, team, position, `%${search}%`],
    );

    const count = await pool.query(
        `
SELECT
COUNT(*)

FROM players

WHERE
($1='All' OR team=$1)

AND ($2='All' OR position=$2)

AND LOWER(name)
LIKE LOWER($3)
`,
        [team, position, `%${search}%`],
    );

    const teamRows = await pool.query(`
  SELECT DISTINCT team
  FROM players
  WHERE team IS NOT NULL
  ORDER BY team
`);
    const positionRows = await pool.query(`
  SELECT DISTINCT position
  FROM players
  WHERE position IS NOT NULL
  ORDER BY position
`);

    return {
        players: players.rows,
        total: Number(count.rows[0].count),
        teams: teamRows.rows.map((row) => row.team),
        positions: positionRows.rows.map((row) => row.position),
    };
}

async function getCachedTeamDetail(teamId, season) {
    const teamResult = await pool.query(
        `
SELECT *
FROM teams
WHERE id = $1
AND season = $2
AND updated_at > NOW() - INTERVAL '24 hours'
`,
        [teamId, season],
    );

    if (teamResult.rows.length === 0) {
        return null;
    }

    const gamesResult = await pool.query(
        `
SELECT *
FROM team_games
WHERE team_id = $1
AND season = $2
ORDER BY game_date ASC
`,
        [teamId, season],
    );
    if (gamesResult.rows.length < 100) {
        return null;
    }

    const team = teamResult.rows[0];

    return {
        id: team.id,
        name: team.name,
        venue: team.venue || "N/A",
        division: team.division || "N/A",
        league: team.league || "N/A",
        season: team.season,
        stats: {
            runs: Number(team.runs) || 0,
            homeRuns: Number(team.home_runs) || 0,
            avg: Number(team.avg) || 0,
            ops: Number(team.ops) || 0,
            era: Number(team.era) || 0,
            strikeOuts: Number(team.strikeouts) || 0,
            whip: Number(team.whip) || 0,
        },
        games: gamesResult.rows.map((game) => ({
            id: game.id,
            date: game.game_date,
            status: game.status,
            opponent: game.opponent,
            homeAway: game.home_away,
            teamScore: game.team_score,
            opponentScore: game.opponent_score,
            result: game.result,
        })),
    };
}

async function saveTeamDetail(teamDetail) {
    await pool.query(
        `
INSERT INTO teams (
    id, name, venue, division, league, season,
    runs, home_runs, avg, ops, era, strikeouts, whip
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
ON CONFLICT (id)
DO UPDATE SET
    name = EXCLUDED.name,
    venue = EXCLUDED.venue,
    division = EXCLUDED.division,
    league = EXCLUDED.league,
    season = EXCLUDED.season,
    runs = EXCLUDED.runs,
    home_runs = EXCLUDED.home_runs,
    avg = EXCLUDED.avg,
    ops = EXCLUDED.ops,
    era = EXCLUDED.era,
    strikeouts = EXCLUDED.strikeouts,
    whip = EXCLUDED.whip,
    updated_at = CURRENT_TIMESTAMP
`,
        [
            teamDetail.id,
            teamDetail.name,
            teamDetail.venue,
            teamDetail.division,
            teamDetail.league,
            teamDetail.season,
            teamDetail.stats.runs,
            teamDetail.stats.homeRuns,
            teamDetail.stats.avg,
            teamDetail.stats.ops,
            teamDetail.stats.era,
            teamDetail.stats.strikeOuts,
            teamDetail.stats.whip,
        ],
    );

    for (const game of teamDetail.games) {
        await pool.query(
            `
INSERT INTO team_games (
    id, team_id, season, game_date, status, opponent,
    home_away, team_score, opponent_score, result
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
ON CONFLICT (id, team_id)
DO UPDATE SET
    team_id = EXCLUDED.team_id,
    season = EXCLUDED.season,
    game_date = EXCLUDED.game_date,
    status = EXCLUDED.status,
    opponent = EXCLUDED.opponent,
    home_away = EXCLUDED.home_away,
    team_score = EXCLUDED.team_score,
    opponent_score = EXCLUDED.opponent_score,
    result = EXCLUDED.result,
    updated_at = CURRENT_TIMESTAMP
`,
            [
                game.id,
                teamDetail.id,
                teamDetail.season,
                game.date,
                game.status,
                game.opponent,
                game.homeAway,
                game.teamScore,
                game.opponentScore,
                game.result,
            ],
        );
    }
}

app.get("/", (req, res) => {
    res.send("MLB Backend is running");
});

app.get("/api/players", async (req, res) => {
    try {
        const page = getPositiveNumber(req.query.page, 1);

        const limit = getPositiveNumber(req.query.limit, 10);

        const offset = (page - 1) * limit;
        const forceRefresh = req.query.refresh === "true";
        const sort = req.query.sort || "hr";
        const requestedSourceLimit = getPositiveNumber(
            req.query.sourceLimit,
            DEFAULT_SOURCE_LIMIT,
        );
        const sourceLimit = Math.min(requestedSourceLimit, MAX_SOURCE_LIMIT);

        const allowedSorts = [
            "hr",
            "avg",
            "ops",
            "rbi",
            "era",
            "whip",
            "strikeouts",
            "wins",
        ];

        const sortColumn = allowedSorts.includes(sort) ? sort : "hr";
        const team = req.query.team || "All";
        const position = req.query.position || "All";
        const search = req.query.search || "";

        const cached = await pool.query(
            `
SELECT *
FROM players
WHERE updated_at > NOW() - INTERVAL '24 hours'

AND ($3 = 'All' OR team = $3)

AND ($4 = 'All' OR position = $4)

AND LOWER(name)
LIKE LOWER($5)

ORDER BY ${sortColumn} DESC

LIMIT $1
OFFSET $2
`,
            [limit, offset, team, position, `%${search}%`],
        );

        if (!forceRefresh && cached.rows.length > 0) {
            console.log("FROM CACHE");
            const pageData = await getPlayerPage({
                sortColumn,
                team,
                position,
                search,
                limit,
                offset,
            });

            return res.json({
                ...pageData,
                players: cached.rows,
                page,
                limit,
            });
        }

        console.log(`FROM MLB API: fetching ${sourceLimit} players`);
        const playersRes = await fetch(
            "https://statsapi.mlb.com/api/v1/sports/1/players",
        );

        const playersData = await playersRes.json();

        const players = playersData.people.slice(0, sourceLimit);

        const result = [];
        const batchSize = 10;

        for (let index = 0; index < players.length; index += batchSize) {
            const batch = players.slice(index, index + batchSize);
            const batchResult = await Promise.all(batch.map(getPlayerStats));

            result.push(...batchResult);
        }

        for (const player of result) {
            await pool.query(
                `
    INSERT INTO players (
      id, name, team, team_id, position, season,
      avg, hr, rbi, ops, era, whip, strikeouts, wins, losses
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    ON CONFLICT (id)
    DO UPDATE SET
      name = EXCLUDED.name,
      team = EXCLUDED.team,
      team_id = EXCLUDED.team_id,
      position = EXCLUDED.position,
      season = EXCLUDED.season,
      avg = EXCLUDED.avg,
      hr = EXCLUDED.hr,
      rbi = EXCLUDED.rbi,
      ops = EXCLUDED.ops,
      era = EXCLUDED.era,
      whip = EXCLUDED.whip,
      strikeouts = EXCLUDED.strikeouts,
      wins = EXCLUDED.wins,
      losses = EXCLUDED.losses,
      updated_at = CURRENT_TIMESTAMP
    `,
                [
                    player.id,
                    player.name,
                    player.team,
                    player.teamId,
                    player.position,
                    player.season,
                    player.avg,
                    player.hr,
                    player.rbi,
                    player.ops,
                    player.era,
                    player.whip,
                    player.strikeouts,
                    player.wins,
                    player.losses,
                ],
            );
        }

        const pageData = await getPlayerPage({
            sortColumn,
            team,
            position,
            search,
            limit,
            offset,
        });

        res.json({
            ...pageData,
            page,
            limit,
            sourceLimit,
            sourceTotal: playersData.people.length,
            imported: result.length,
        });
    } catch (error) {
        console.error("API /api/players error:", error);
        res.status(500).json({
            message: "Fetch failed",
        });
    }
});
app.get("/api/players/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const personData = await fetchJson(
            `https://statsapi.mlb.com/api/v1/people/${id}`,
        );
        const person = personData.people?.[0];

        if (!person) {
            return res.status(404).json({ message: "Player not found" });
        }

        const [statsData, pitchingData] = await Promise.all([
            fetchJson(
                `https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=yearByYear&group=hitting`,
            ),
            fetchJson(
                `https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=yearByYear&group=pitching`,
            ),
        ]);
        const seasons =
            statsData.stats?.[0]?.splits?.map((s) => ({
                season: s.season,
                hr: Number(s.stat.homeRuns) || 0,
                rbi: Number(s.stat.rbi) || 0,
                avg: Number(s.stat.avg) || 0,
                ops: Number(s.stat.ops) || 0,
            })) || [];
        const pitchingSeasons =
            pitchingData.stats?.[0]?.splits?.map((s) => ({
                season: s.season,
                era: Number(s.stat.era) || 0,
                whip: Number(s.stat.whip) || 0,
                strikeouts: Number(s.stat.strikeOuts) || 0,
                wins: Number(s.stat.wins) || 0,
                losses: Number(s.stat.losses) || 0,
            })) || [];
        const latestSeason = seasons.at(-1) || {};
        const latestPitchingSeason = pitchingSeasons.at(-1) || {};

        res.json({
            id: person.id,
            name: person.fullName,
            position: person.primaryPosition?.abbreviation || "N/A",
            avg: latestSeason.avg || 0,
            hr: latestSeason.hr || 0,
            rbi: latestSeason.rbi || 0,
            ops: latestSeason.ops || 0,
            era: latestPitchingSeason.era || 0,
            whip: latestPitchingSeason.whip || 0,
            strikeouts: latestPitchingSeason.strikeouts || 0,
            wins: latestPitchingSeason.wins || 0,
            losses: latestPitchingSeason.losses || 0,
            seasons,
            pitchingSeasons,
        });
    } catch {
        res.status(500).json({ message: "Failed to fetch player detail" });
    }
});

app.get("/api/teams/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const season = getPositiveNumber(req.query.season, CURRENT_SEASON);
        const forceRefresh = req.query.refresh === "true";
        const cachedTeam = await getCachedTeamDetail(Number(id), season);

        if (!forceRefresh && cachedTeam) {
            console.log("TEAM FROM CACHE");

            return res.json(cachedTeam);
        }

        const [teamData, statsData, scheduleData] = await Promise.all([
            fetchJson(`https://statsapi.mlb.com/api/v1/teams/${id}`),
            fetchJson(
                `https://statsapi.mlb.com/api/v1/teams/${id}/stats?stats=season&group=hitting,pitching&season=${season}`,
            ),
            fetchJson(
                `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${id}&season=${season}&gameType=R`,
            ),
        ]);
        const team = teamData.teams?.[0];

        if (!team) {
            return res.status(404).json({ message: "Team not found" });
        }

        const hitting =
            statsData.stats?.find((statGroup) =>
                statGroup.group?.displayName?.toLowerCase().includes("hitting"),
            )?.splits?.[0]?.stat || {};
        const pitching =
            statsData.stats?.find((statGroup) =>
                statGroup.group?.displayName
                    ?.toLowerCase()
                    .includes("pitching"),
            )?.splits?.[0]?.stat || {};
        const games = scheduleData.dates.flatMap((date) =>
            date.games.map((game) => {
                const home = game.teams.home;
                const away = game.teams.away;
                const isHome = home.team.id === Number(id);
                const opponent = isHome ? away.team : home.team;
                const teamScore = isHome ? home.score : away.score;
                const opponentScore = isHome ? away.score : home.score;

                return {
                    id: game.gamePk,
                    date: game.gameDate,
                    status: game.status?.detailedState || "Unknown",
                    opponent: opponent.name,
                    homeAway: isHome ? "Home" : "Away",
                    teamScore: teamScore ?? null,
                    opponentScore: opponentScore ?? null,
                    result:
                        typeof teamScore === "number" &&
                        typeof opponentScore === "number"
                            ? teamScore > opponentScore
                                ? "W"
                                : "L"
                            : "-",
                };
            }),
        );

        const teamDetail = {
            id: team.id,
            name: team.name,
            venue: team.venue?.name || "N/A",
            division: team.division?.name || "N/A",
            league: team.league?.name || "N/A",
            season,
            stats: {
                runs: Number(hitting.runs) || 0,
                homeRuns: Number(hitting.homeRuns) || 0,
                avg: Number(hitting.avg) || 0,
                ops: Number(hitting.ops) || 0,
                era: Number(pitching.era) || 0,
                strikeOuts: Number(pitching.strikeOuts) || 0,
                whip: Number(pitching.whip) || 0,
            },
            games,
        };

        await saveTeamDetail(teamDetail);

        res.json(teamDetail);
    } catch (error) {
        console.error("Failed to fetch team detail", error);
        res.status(500).json({ message: "Failed to fetch team detail" });
    }
});

ensureSchema()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Failed to initialize database schema", error);
        process.exit(1);
    });
