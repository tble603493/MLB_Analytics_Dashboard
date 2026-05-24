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
);

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
);

CREATE TABLE IF NOT EXISTS team_games (
    id INTEGER,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    season INTEGER,
    game_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'Unknown',
    opponent TEXT NOT NULL,
    home_away TEXT NOT NULL CHECK (home_away IN ('Home', 'Away')),
    team_score INTEGER,
    opponent_score INTEGER,
    result TEXT NOT NULL DEFAULT '-' CHECK (result IN ('W', 'L', '-')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, team_id)
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_players_team_id'
    ) THEN
        ALTER TABLE players
        ADD CONSTRAINT fk_players_team_id
        FOREIGN KEY (team_id)
        REFERENCES teams(id)
        ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_players_team
    ON players (team);

CREATE INDEX IF NOT EXISTS idx_players_team_id
    ON players (team_id);

CREATE INDEX IF NOT EXISTS idx_players_position
    ON players (position);

CREATE INDEX IF NOT EXISTS idx_players_updated_at
    ON players (updated_at);

CREATE INDEX IF NOT EXISTS idx_players_name_lower
    ON players (LOWER(name));

CREATE INDEX IF NOT EXISTS idx_players_hr
    ON players (hr DESC);

CREATE INDEX IF NOT EXISTS idx_players_avg
    ON players (avg DESC);

CREATE INDEX IF NOT EXISTS idx_players_ops
    ON players (ops DESC);

CREATE INDEX IF NOT EXISTS idx_players_rbi
    ON players (rbi DESC);

CREATE INDEX IF NOT EXISTS idx_players_era
    ON players (era DESC);

CREATE INDEX IF NOT EXISTS idx_players_whip
    ON players (whip DESC);

CREATE INDEX IF NOT EXISTS idx_players_strikeouts
    ON players (strikeouts DESC);

CREATE INDEX IF NOT EXISTS idx_players_wins
    ON players (wins DESC);

CREATE INDEX IF NOT EXISTS idx_teams_name
    ON teams (name);

CREATE INDEX IF NOT EXISTS idx_teams_season
    ON teams (season);

CREATE INDEX IF NOT EXISTS idx_team_games_team_id
    ON team_games (team_id);

CREATE INDEX IF NOT EXISTS idx_team_games_team_season
    ON team_games (team_id, season);

CREATE INDEX IF NOT EXISTS idx_team_games_date
    ON team_games (game_date DESC);
