
import { useLanguage } from "../i18n";

export function ProductCard({ product }) {
    const { t } = useLanguage();
    const { id, title, game, category, price, currency, seller, status, image } = product;

    return (
        <a
            className="group overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] transition hover:border-[var(--accent)] hover:shadow-md"
            href={`/product/${id}`}
        >
            {image ? (
                <div className="relative aspect-[1.8] overflow-hidden bg-[var(--surface-strong)]">
                    <img
                        alt=""
                        className="size-full object-cover opacity-80 transition duration-300 group-hover:scale-105 group-hover:opacity-100"
                        draggable="false"
                        src={image}
                    />
                    <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-2 left-3 text-xs font-bold text-white/90">{game}</span>
                </div>
            ) : null}
            <div className="p-4">
                <div className="mb-2 flex items-center gap-2">
                    <span className="rounded bg-[var(--surface-strong)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-strong)]">
                        {t(`catalog.categories.${category}`)}
                    </span>
                    {status === "active" ? (
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            {t("product.active")}
                        </span>
                    ) : null}
                </div>
                <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[var(--text)]">{title}</h3>
                <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-black text-[var(--accent-strong)]">
                        {price.toLocaleString()} {currency}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                        <span className={`inline-block size-2 rounded-full ${seller.online ? "bg-emerald-400" : "bg-[var(--muted)]/40"}`} />
                        {seller.nick}
                    </span>
                </div>
            </div>
        </a>
    );
}