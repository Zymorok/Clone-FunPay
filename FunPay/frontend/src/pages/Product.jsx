
import { useState, useEffect } from "react";
import {
    ArrowLeft,
    MessageCircle,
    ShieldCheck,
    Eye,
    Calendar,
    Tag,
    User,
    Loader2,
    AlertTriangle
} from "lucide-react";
import { useLanguage } from "../i18n";
import { useAuth } from "../auth/AuthContext";

// Mock data for demonstration — replace with getProductById(id)
const mockProducts = {
    "1": {
        id: "1",
        title: "Counter-Strike 2 — Prime Account, Level 21+",
        game: "Counter-Strike 2",
        category: "accounts",
        description: "Verified Prime account with Level 21+. Clean VAC history, 500+ competitive hours. Includes loyalty badge and service medal 2024. Instant delivery via Steam credentials change.",
        price: 450,
        currency: "UAH",
        seller: { publicId: "progamer777", nick: "ProGamer777", online: true, sales: 342, rating: 4.9, registered: "2024-03-10" },
        status: "active",
        views: 1205,
        createdAt: "2025-07-01",
        image: "/assets/website/offers/assets_counter_strike_2.png"
    },
    "2": {
        id: "2",
        title: "Valorant Boost to Diamond — Fast & Safe",
        game: "Valorant",
        category: "services",
        description: "Professional boosting to Diamond rank. Playing on your account or duo queue. 3-5 days average completion time. Stream on request. No cheats, 100% safe. All agents unlocked during boost.",
        price: 800,
        currency: "UAH",
        seller: { publicId: "boostking", nick: "BoostKing", online: true, sales: 156, rating: 4.8, registered: "2024-05-15" },
        status: "active",
        views: 562,
        createdAt: "2025-07-05",
        image: "/assets/website/offers/assets_valorant.png"
    }
};

export function Product() {
    const { t } = useLanguage();
    const { isAuthenticated, user, token } = useAuth();
    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [orderSent, setOrderSent] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Extract product ID from URL
    const productId = window.location.pathname.split("/product/")[1];

    useEffect(() => {
        setIsLoading(true);
        setError(null);

        // Replace with: getProductById(productId)
        setTimeout(() => {
            const found = mockProducts[productId];
            if (found) {
                setProduct(found);
            } else {
                setError("Product not found");
            }
            setIsLoading(false);
        }, 400);
    }, [productId]);

    async function handleContact() {
        if (!isAuthenticated) {
            window.location.href = `/login?return=${encodeURIComponent(window.location.pathname)}`;
            return;
        }
        setIsSending(true);
        // Replace with: createOrder(token, { productId: product.id, message: "..." })
        await new Promise((r) => setTimeout(r, 600));
        setOrderSent(true);
        setIsSending(false);
    }

    if (isLoading) {
        return (
            <main className="flex min-h-[50vh] items-center justify-center">
                <div className="size-8 animate-spin rounded-full border-[3px] border-[var(--border)] border-t-[var(--accent)]" />
            </main>
        );
    }

    if (error || !product) {
        return (
            <main className="flex min-h-[50vh] items-center justify-center px-4">
                <div className="text-center">
                    <AlertTriangle size={40} className="mx-auto mb-4 text-[var(--danger)]" />
                    <h1 className="text-xl font-bold text-[var(--text)]">{t("product.notFound")}</h1>
                    <p className="mt-2 text-sm text-[var(--muted)]">{t("product.notFoundText")}</p>
                    <a className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--link)]" href="/catalog">
                        <ArrowLeft size={16} /> {t("product.backToCatalog")}
                    </a>
                </div>
            </main>
        );
    }

    const isOwner = isAuthenticated && user?.publicId === product.seller.publicId;

    return (
        <main className="mx-auto max-w-[1260px] px-4 py-6 sm:px-6">
            {/* Breadcrumb */}
            <nav className="mb-5 flex items-center gap-2 text-sm text-[var(--muted)]">
                <a className="hover:text-[var(--text)]" href="/">{t("nav.home")}</a>
                <span>/</span>
                <a className="hover:text-[var(--text)]" href="/catalog">{t("nav.catalog")}</a>
                <span>/</span>
                <span className="truncate text-[var(--text)]">{product.title}</span>
            </nav>

            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                {/* Main content */}
                <div>
                    {/* Image */}
                    {product.image ? (
                        <div className="overflow-hidden rounded-lg border border-[var(--border)]">
                            <img
                                alt={product.title}
                                className="aspect-[2.2] w-full object-cover"
                                src={product.image}
                            />
                        </div>
                    ) : null}

                    {/* Header */}
                    <div className="mt-5">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-[var(--surface-strong)] px-2 py-0.5 text-xs font-bold uppercase text-[var(--accent-strong)]">
                                {product.game}
                            </span>
                            <span className={`rounded px-2 py-0.5 text-xs font-bold ${product.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                                {product.status === "active" ? t("product.active") : t("product.paused")}
                            </span>
                        </div>
                        <h1 className="mt-3 text-2xl font-black leading-tight text-[var(--text)] sm:text-3xl">
                            {product.title}
                        </h1>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
                            <span className="inline-flex items-center gap-1.5"><Eye size={14} /> {product.views}</span>
                            <span className="inline-flex items-center gap-1.5"><Calendar size={14} /> {product.createdAt}</span>
                            <span className="inline-flex items-center gap-1.5"><Tag size={14} /> {t(`catalog.categories.${product.category}`)}</span>
                        </div>
                    </div>

                    {/* Description */}
                    <section className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
                        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--muted)]">{t("product.description")}</h2>
                        <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--text)]">{product.description}</p>
                    </section>

                    {/* Edit button for owner */}
                    {isOwner ? (
                        <a
                            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-bold text-[var(--text)] transition hover:border-[var(--accent)]"
                            href={`/product/${product.id}/edit`}
                        >
                            {t("product.edit")}
                        </a>
                    ) : null}
                </div>

                {/* Sidebar */}
                <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
                    {/* Price card */}
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 text-center">
                        <div className="text-3xl font-black text-[var(--accent-strong)]">
                            {product.price.toLocaleString()} {product.currency}
                        </div>
                        <p className="mt-1 text-xs text-[var(--muted)]">{t("product.fixedPrice")}</p>

                        {!isOwner ? (
                            orderSent ? (
                                <div className="mt-5 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400">
                                    {t("product.orderSent")}
                                </div>
                            ) : (
                                <button
                                    className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] text-sm font-extrabold text-[var(--accent-text)] transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
                                    disabled={isSending}
                                    onClick={handleContact}
                                >
                                    {isSending ? <Loader2 className="animate-spin" size={18} /> : <MessageCircle size={18} />}
                                    {isAuthenticated ? t("product.contactSeller") : t("product.loginToBuy")}
                                </button>
                            )
                        ) : null}
                    </div>

                    {/* Seller card */}
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
                        <a className="flex items-center gap-3" href={`/profile/${product.seller.publicId}`}>
                            <div className="relative grid size-11 place-items-center rounded-full bg-[var(--surface-strong)] text-sm font-black text-[var(--accent-strong)]">
                                {product.seller.nick.slice(0, 2).toUpperCase()}
                                <span className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-[var(--surface)] ${product.seller.online ? "bg-emerald-400" : "bg-[var(--muted)]/40"}`} />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-[var(--text)]">{product.seller.nick}</div>
                                <div className="text-xs text-[var(--muted)]">{product.seller.sales} {t("product.sales")} · ★ {product.seller.rating}</div>
                            </div>
                        </a>
                        <a
                            className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-xs font-bold text-[var(--text)] transition hover:border-[var(--accent)]"
                            href={`/profile/${product.seller.publicId}`}
                        >
                            <User size={14} />
                            {t("product.viewProfile")}
                        </a>
                    </div>

                    {/* Security */}
                    <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                        <ShieldCheck size={20} className="shrink-0 text-emerald-400" />
                        <p className="text-xs leading-4 text-[var(--muted)]">{t("product.securityNote")}</p>
                    </div>
                </aside>
            </div>
        </main>
    );
}