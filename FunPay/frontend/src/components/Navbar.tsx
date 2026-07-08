import type { Theme } from "../App";
import { LogoMark } from "./LogoMark";
import { ThemeToggle } from "./ThemeToggle";

type NavbarProps = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
};

const navItems = [
  { label: "Каталог", path: "/catalog" },
  { label: "Мои заказы", path: "/orders" },
  { label: "Чат", path: "/chat" },
  { label: "Поддержка", path: "/support" }
];

export function Navbar({ theme, onThemeChange }: NavbarProps) {
  return (
    <header className="mx-auto max-w-[1260px] px-4 pt-3 sm:px-6">
      <div className="flex h-[58px] items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-6 shadow-[var(--shadow)]">
        <a className="flex items-center gap-3 text-[var(--text)]" href="/register">
          <LogoMark />
          <span className="text-lg font-extrabold leading-none tracking-normal">
            Fun<span className="text-[var(--accent-strong)]">Pay</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Главная навигация">
          {navItems.map((item) => (
            <a
              className="nav-ring-link inline-flex items-center justify-center px-2 py-1 text-sm font-semibold"
              href={item.path}
              key={item.path}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onThemeChange={onThemeChange} />
          <a
            className="nav-ring-link nav-ring-link--login hidden h-10 items-center rounded-lg px-5 text-sm font-bold sm:inline-flex"
            href="/login"
          >
            Войти
          </a>
        </div>
      </div>
    </header>
  );
}
