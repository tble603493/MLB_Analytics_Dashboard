type Player = {
    id: number;
    name: string;
    team: string;
    position: string;
    avg: number;
    hr: number;
    rbi: number;
    ops: number;
    obp: number;
    slg: number;
};

export default function PlayerCard({ player }: { player: Player }) {
    return (
        <div
            style={{
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "20px",
            }}
        >
            <h2>{player.name}</h2>
            <p>
                {player.team} - {player.position}
            </p>

            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <p>AVG: {player.avg}</p>
                <p>HR: {player.hr}</p>
                <p>RBI: {player.rbi}</p>
                <p>OPS: {player.ops}</p>
                <p>OBP: {player.obp}</p>
                <p>SLG: {player.slg}</p>
            </div>
        </div>
    );
}
