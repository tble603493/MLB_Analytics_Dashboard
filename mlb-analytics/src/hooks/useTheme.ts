import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function getInitialTheme(): Theme {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark" || savedTheme === "light") {
        return savedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);
    const dark = theme === "dark";

    useEffect(() => {
        document.documentElement.classList.toggle("dark", dark);
        localStorage.setItem("theme", theme);
    }, [dark, theme]);

    function setDark(value: boolean) {
        setTheme(value ? "dark" : "light");
    }

    return {
        dark,
        setDark,
        theme,
    };
}
