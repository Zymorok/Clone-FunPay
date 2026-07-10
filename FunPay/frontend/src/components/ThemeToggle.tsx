import { Moon, Sun } from "lucide-react";
import type { Theme } from "../app/theme";

type ThemeToggleProps = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
};

export function ThemeToggle({ theme, onThemeChange }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <button
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      className="inline-flex h-9 w-[66px] items-center justify-between rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-1.5 text-[var(--muted)] transition hover:text-[var(--text)]"
      onClick={() => onThemeChange(isDark ? "light" : "dark")}
      type="button"
    >
      <span
        className={`grid size-6 place-items-center rounded-full transition ${
          isDark ? "text-[var(--muted)]" : "bg-[var(--accent)] text-[var(--accent-text)]"
        }`}
      >
        <Sun size={13} aria-hidden="true" />
      </span>
      <span
        className={`grid size-6 place-items-center rounded-full transition ${
          isDark ? "bg-[var(--accent)] text-[var(--accent-text)]" : "text-[var(--muted)]"
        }`}
      >
        <Moon size={13} aria-hidden="true" />
      </span>
    </button>
  );
}
