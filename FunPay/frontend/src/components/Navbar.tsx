import type { Theme } from "../App";
import { LogoMark } from "./LogoMark";
import { ThemeToggle } from "./ThemeToggle";

type NavbarProps = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
};

const navItems = ["Каталог", "Мои заказы", "Чат", "Поддержка"];

export function Navbar({ theme, onThemeChange }: NavbarProps) {
  return (
    <header className="mx-auto max-w-[1260px] px-4 pt-3 sm:px-6">
      <div className="flex h-[58px] items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-6 shadow-[var(--shadow)]">
        <a className="flex items-center gap-3 text-[var(--text)]" href="/">
          <LogoMark />
          <span className="text-lg font-extrabold leading-none tracking-normal">
            Fun<span className="text-[var(--accent-strong)]">Pay</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Главная навигация">
          {navItems.map((item) => (
            <a
              className="text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--text)]"
              href={`#${item.toLowerCase()}`}
              key={item}
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onThemeChange={onThemeChange} />
          <a
            className="hidden h-10 items-center rounded-lg px-5 text-sm font-bold text-[var(--text)] transition hover:bg-[var(--surface-strong)] sm:inline-flex"
            href="#login"
          >
            Войти
          </a>
        </div>
      </div>
    </header>
  );
}
