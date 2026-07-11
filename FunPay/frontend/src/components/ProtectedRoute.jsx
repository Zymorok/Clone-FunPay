
import { useAuth } from "../auth/AuthContext";
import { useLanguage } from "../i18n";
import { Lock, ShieldX, ArrowRight } from "lucide-react";

export function ProtectedRoute({ children, requiredRole = null }) {
    const { t } = useLanguage();
    const { isAuthenticated, user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-[3px] border-[var(--border)] border-t-[var(--accent)]" />
                    <p className="text-sm text-[var(--muted)]">{t("common.loading")}</p>
                </div>
            </main>
        );
    }

    if (!isAuthenticated) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center px-4">
                <div className="max-w-md text-center">
                    <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-[var(--surface-strong)] text-[var(--accent-strong)]">
                        <Lock size={28} />
                    </div>
                    <h1 className="text-2xl font-black text-[var(--text)]">{t("auth.loginRequired")}</h1>
                    <p className="mt-2 text-sm text-[var(--muted)]">{t("auth.loginRequiredText")}</p>
                    <a
                        className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-[var(--accent)] px-6 text-sm font-extrabold text-[var(--accent-text)] transition hover:bg-[var(--accent-strong)]"
                        href={`/login?return=${encodeURIComponent(window.location.pathname)}`}
                    >
                        {t("nav.login")}
                        <ArrowRight size={16} />
                    </a>
                </div>
            </main>
        );
    }

    if (requiredRole && user?.role !== requiredRole) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center px-4">
                <div className="max-w-md text-center">
                    <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] text-[var(--danger)]">
                        <ShieldX size={28} />
                    </div>
                    <h1 className="text-2xl font-black text-[var(--text)]">{t("auth.accessDenied")}</h1>
                    <p className="mt-2 text-sm text-[var(--muted)]">{t("auth.accessDeniedText")}</p>
                    <a
                        className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-6 text-sm font-extrabold text-[var(--text)] transition hover:border-[var(--accent)]"
                        href="/"
                    >
                        {t("routes.common.backHome")}
                    </a>
                </div>
            </main>
        );
    }

    return children;
}