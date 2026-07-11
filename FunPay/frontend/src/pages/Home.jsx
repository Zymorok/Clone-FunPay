
import { useState, useEffect } from "react";
import {
    ArrowRight,
    Gamepad2,
    ShieldCheck,
    Zap,
    MessageCircle,
    TrendingUp,
    Star
} from "lucide-react";
import { useLanguage } from "../i18n";
import { ProductCard } from "../components/ProductCard";

const categories = [
    { slug: "accounts", icon: Gamepad2 },
    { slug: "currency", icon: TrendingUp },
    { slug: "items", icon: Star },
    { slug: "services", icon: Zap },
    { slug: "keys", icon: ShieldCheck },
    { slug: "other", icon: MessageCircle }
];

// Mock featured products for demo (replace with API call)
const mockFeatured = [
    {
        id: "1",
        title: "Counter-Strike 2 — Prime Account, Level 21+",
        game: "Counter-Strike 2",
        category: "accounts",
        price: 450,
        currency: "UAH",
        seller: { publicId: "progamer777", nick: "ProGamer777", online: true },
        status: "active",
        image: "/assets/website/offers/assets_counter_strike_2.png"
    },
    {
        id: "2",
        title: "Valorant Boost to Diamond — Fast & Safe",
        game: "Valorant",
        category: "services",
        price: 800,
        currency: "UAH",
        seller: { publicId: "boostking", nick: "BoostKing", online: true },
        status: "active",
        image: "/assets/website/offers/assets_valorant.png"
    },
    {
        id: "3",
        title: "Dota 2 — Arcana Bundle (5 items)",
        game: "Dota 2",
        category: "items",
        price: 2200,
        currency: "UAH",
        seller: { publicId: "tradevault", nick: "TradeVault", online: false },
        status: "active",
        image: "/assets/website/offers/assets_dota_2.jpg"
    },
    {
        id: "4",
        title: "Rust — Full Progression Account 2000hrs",
        game: "Rust",
        category: "accounts",
        price: 1500,
        currency: "UAH",
        seller: { publicId: "rustlord", nick: "RustLord", online: true },
        status: "active",
        image: "/assets/website/offers/assets_rust.png"
    },
    {
        id: "5",
        title: "GTA V Modded Account $500M + Level 400",
        game: "Grand Theft Auto V",
        category: "accounts",
        price: 350,
        currency: "UAH",
        seller: { publicId: "progamer777", nick: "ProGamer777", online: true },
        status: "active",
        image: "/assets/website/offers/assets_gta_v.jpg"
    },
    {
        id: "6",
        title: "Albion Online — 50M Silver, Fast Delivery",
        game: "Albion Online",
        category: "currency",
        price: 600,
        currency: "UAH",
        seller: { publicId: "tradevault", nick: "TradeVault", online: false },
        status: "active",
        image: "/assets/website/offers/assets_albion_online.jpeg"
    }
];

export function Home() {
    const { t } = useLanguage();
    const [featured, setFeatured] = useState(mockFeatured);
    const [isLoading, setIsLoading] = useState(false);

    // Replace with real API call:
    // useEffect(() => {
    //   setIsLoading(true);
    //   getFeaturedProducts().then(setFeatured).finally(() => setIsLoading(false));
    // }, []);

    return (
        <main className="mx-auto max-w-[1260px] px-4 py-6 sm:px-6">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 via-transparent to-transparent" />
                <div className="relative px-6 py-12 sm:px-10 sm:py-16">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-bold text-[var(--accent-strong)]">
                        <Zap size={14} />
                        {t("home.heroLabel")}
                    </div>
                    <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight tracking-tight text-[var(--text)] sm:text-5xl">
                        {t("home.heroTitle")}
                    </h1>
                    <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">
                        {t("home.heroSubtitle")}
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <a
                            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[var(--accent)] px-6 text-sm font-extrabold text-[var(--accent-text)] transition hover:bg-[var(--accent-strong)]"
                            href="/catalog"
                        >
                            {t("home.browseCatalog")}
                            <ArrowRight size={16} />
                        </a>
                        <a
                            className="inline-flex h-11 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-6 text-sm font-extrabold text-[var(--text)] transition hover:border-[var(--accent)]"
                            href="/register"
                        >
                            {t("home.startSelling")}
                        </a>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="mt-10">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-[var(--text)]">{t("home.categories")}</h2>
                    <a className="text-sm font-semibold text-[var(--link)] hover:text-[var(--accent-strong)]" href="/catalog">
                        {t("home.viewAll")} &rarr;
                    </a>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {categories.map(({ slug, icon: Icon }) => (
                        <a
                            className="group flex flex-col items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--accent)] hover:shadow-md"
                            href={`/catalog?category=${slug}`}
                            key={slug}
                        >
                            <span className="grid size-10 place-items-center rounded-lg bg-[var(--surface-strong)] text-[var(--muted)] transition group-hover:text-[var(--accent-strong)]">
                                <Icon size={20} />
                            </span>
                            <span className="text-center text-sm font-bold text-[var(--text)]">
                                {t(`home.cat.${slug}`)}
                            </span>
                        </a>
                    ))}
                </div>
            </section>

            {/* Featured Offers */}
            <section className="mt-10">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-[var(--text)]">{t("home.featured")}</h2>
                    <a className="text-sm font-semibold text-[var(--link)] hover:text-[var(--accent-strong)]" href="/catalog">
                        {t("home.viewAll")} &rarr;
                    </a>
                </div>

                {isLoading ? (
                    <div className="mt-8 flex justify-center">
                        <div className="size-8 animate-spin rounded-full border-[3px] border-[var(--border)] border-t-[var(--accent)]" />
                    </div>
                ) : featured.length === 0 ? (
                    <div className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
                        <p className="text-sm text-[var(--muted)]">{t("home.noOffers")}</p>
                    </div>
                ) : (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {featured.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </section>

            {/* Trust indicators */}
            <section className="mt-12 grid gap-4 sm:grid-cols-3">
                {[
                    { icon: ShieldCheck, titleKey: "home.trust.safe", textKey: "home.trust.safeText" },
                    { icon: Zap, titleKey: "home.trust.fast", textKey: "home.trust.fastText" },
                    { icon: MessageCircle, titleKey: "home.trust.support", textKey: "home.trust.supportText" }
                ].map(({ icon: Icon, titleKey, textKey }) => (
                    <div
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5"
                        key={titleKey}
                    >
                        <Icon size={22} className="text-[var(--accent-strong)]" />
                        <h3 className="mt-3 text-sm font-bold text-[var(--text)]">{t(titleKey)}</h3>
                        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{t(textKey)}</p>
                    </div>
                ))}
            </section>
        </main>
    );
}