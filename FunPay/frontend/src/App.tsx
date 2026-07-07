import { useEffect, useState } from "react";
import { Navbar } from "./components/Navbar";
import { Register } from "./pages/Register";

export type Theme = "light" | "dark";

const themeStorageKey = "funpay-theme";

function getInitialTheme(): Theme {
  const savedTheme = localStorage.getItem(themeStorageKey);

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  return (
    <div className="min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)] transition-colors duration-200">
      <Navbar theme={theme} onThemeChange={setTheme} />
      <Register />
    </div>
  );
}
