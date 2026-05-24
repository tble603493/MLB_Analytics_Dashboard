import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { players } from "../data/mockPlayers";

export default function PlayerChart() {
    return (
        <div
            style={{
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "20px",
                marginTop: "24px",
                height: "350px",
            }}
        >
            <h2>So sánh Home Runs</h2>

            <ResponsiveContainer width="100%" height="85%">
                <BarChart data={players}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="hr" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
