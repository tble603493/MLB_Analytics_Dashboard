import ReactDOM from "react-dom/client";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App";

import PlayerDetail from "./pages/PlayerDetail";
import TeamDetail from "./pages/TeamDetail";

import "./index.css";

import { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />

                <Route path="/player/:id" element={<PlayerDetail />} />
                <Route path="/team/:id" element={<TeamDetail />} />
            </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
    </QueryClientProvider>,
);
