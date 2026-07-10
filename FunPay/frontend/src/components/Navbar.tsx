import type { Theme } from "../app/theme";
import { useLanguage } from "../i18n";
import { LanguageToggle } from "./LanguageToggle";
import { LogoMark } from "./LogoMark";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { useAuth } from "../auth/AuthContext";

type NavbarProps = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
};

export function Navbar({ theme, onThemeChange }: NavbarProps) {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navItems = [
    { label: t("nav.catalog"), path: "/catalog" },
    { label: t("nav.orders"), path: "/orders" },
    { label: t("nav.chat"), path: "/chat" },
    { label: t("nav.support"), path: "/support" }
  ];

  return (
    <header className="site-navbar mx-auto max-w-[1260px] px-4 pt-3 sm:px-6">
      <div className="site-navbar__glass flex h-[58px] items-center justify-between rounded-lg border px-6">
        <a className="flex items-center gap-3 text-[var(--text)]" href="/register">
          <LogoMark />
          <span className="text-lg font-extrabold leading-none tracking-normal">
            Fun<span className="text-[var(--accent-strong)]">Pay</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 md:flex" aria-label={t("nav.aria")}>
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
          <LanguageToggle />
          <ThemeToggle theme={theme} onThemeChange={onThemeChange} />
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <a
              className="nav-ring-link nav-ring-link--login hidden h-10 items-center rounded-lg px-5 text-sm font-bold sm:inline-flex"
              href="/login"
            >
              {t("nav.login")}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
