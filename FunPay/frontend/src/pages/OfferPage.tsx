import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, PackageX, ShoppingCart, Star, Tag } from "lucide-react";
import catalogDataRaw from "../data/catalogData.json";
import type { CatalogData } from "../types/catalog";
import { CheckoutModal } from "../components/CheckoutModal";
import { useLanguage } from "../i18n";

const catalogData = catalogDataRaw as CatalogData;

export function OfferPage() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const successTimerRef = useRef<number | null>(null);

  const products = Array.isArray(catalogData.products) ? catalogData.products : [];
  const games = Array.isArray(catalogData.games) ? catalogData.games : [];
  const categories = Array.isArray(catalogData.categories) ? catalogData.categories : [];
  const product = products.find((item) => String(item.id) === id);
  const game = product ? games.find((item) => item.id === product.gameId) : null;
  const category = product ? categories.find((item) => item.id === product.categoryId) : null;

  useEffect(() => {
    return () => {
      if (successTimerRef.current !== null) {
        window.clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  if (!product) {
    return (
      <main className="mx-auto max-w-[1260px] px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center gap-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-8 py-16 text-center shadow-[var(--shadow)]">
          <span className="grid size-16 place-items-center rounded-full bg-[var(--surface-strong)] text-[var(--muted)]">
            <PackageX size={32} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-black text-[var(--text)]">{t("offer.notFoundTitle")}</h1>
            <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
              {t("offer.notFoundText")}
            </p>
          </div>
          <Link
            className="offer-page-action inline-flex h-11 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-5 text-sm font-extrabold text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
            to="/catalog"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            {t("offer.backToCatalog")}
          </Link>
        </div>
      </main>
    );
  }

  const priceFormatted = new Intl.NumberFormat(language === "uk" ? "uk-UA" : "ru-RU", {
    minimumFractionDigits: 2
  }).format(Number.isFinite(product.price) ? product.price : 0);
  const rating = `4.${(product.id % 3) + 7}`;
  const reviewCount = (product.id % 90) + 40;
  const gameName = game?.name || "—";
  const categoryName = category?.name || "—";

  function handleConfirm() {
    setIsModalOpen(false);
    setIsSuccess(true);

    if (successTimerRef.current !== null) {
      window.clearTimeout(successTimerRef.current);
    }

    successTimerRef.current = window.setTimeout(() => {
      setIsSuccess(false);
      successTimerRef.current = null;
    }, 4000);
  }

  return (
    <>
      <main className="mx-auto max-w-[1260px] px-4 py-6 sm:px-6">
        {isSuccess && (
          <div className="checkout-success" aria-live="polite" role="status">
            <CheckCircle2 size={18} aria-hidden="true" />
            {t("offer.success")}
          </div>
        )}

        <nav className="mb-4">
          <Link
            className="offer-page-link inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--accent-strong)]"
            to="/catalog"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            {t("offer.catalog")}
          </Link>
        </nav>

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-5">
            <div className="offer-page-cover relative overflow-hidden rounded-lg border border-[var(--border)] shadow-[var(--shadow)]">
              {game?.imageUrl ? (
                <img
                  alt={gameName}
                  className="absolute inset-0 size-full object-cover"
                  draggable="false"
                  src={game.imageUrl}
                />
              ) : null}
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,7,14,0.10),rgba(2,7,14,0.80))]" />

              <div className="relative flex h-full flex-col justify-end p-6">
                {category ? (
                  <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-lg border border-white/18 bg-black/32 px-3 py-1.5 text-xs font-extrabold text-white/88 backdrop-blur">
                    <Tag size={12} aria-hidden="true" />
                    {categoryName}
                  </span>
                ) : null}
                <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">{product.title}</h1>
                {game ? (
                  <p className="mt-2 text-sm font-semibold text-white/70">{gameName}</p>
                ) : null}
              </div>
            </div>

            <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
              <h2 className="text-lg font-black text-[var(--text)]">{t("offer.description")}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{product.description}</p>

              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-5 sm:grid-cols-3">
                {[
                  { label: t("offer.details.game"), value: gameName },
                  { label: t("offer.details.category"), value: categoryName },
                  { label: t("offer.details.status"), value: product.status },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--muted)]">{label}</p>
                    <p className="mt-1 text-sm font-extrabold text-[var(--text)]">{value}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] lg:sticky lg:top-4">
            <p className="text-[13px] font-extrabold uppercase tracking-wide text-[var(--muted)]">{t("offer.price")}</p>
            <p className="mt-1 text-4xl font-black text-[var(--text)]">
              {priceFormatted}
              <span className="ml-1 text-xl font-extrabold text-[var(--muted)]">₽</span>
            </p>

            <div className="mt-3 flex items-center gap-1.5 text-sm text-[var(--muted)]">
              <Star size={14} className="text-[var(--accent-strong)]" fill="currentColor" aria-hidden="true" />
              <span className="font-extrabold text-[var(--text)]">{rating}</span>
              <span>· {t("offer.reviews", { count: reviewCount })}</span>
            </div>

            <button
              className="offer-page-buy mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] text-sm font-extrabold text-[var(--accent-text)] shadow-sm transition hover:bg-[var(--accent-strong)]"
              onClick={() => setIsModalOpen(true)}
              type="button"
            >
              <ShoppingCart size={17} aria-hidden="true" />
              {t("offer.buy")}
            </button>

            <p className="mt-4 text-center text-xs text-[var(--muted)]">
              {t("offer.securePayment")}
            </p>
          </aside>
        </div>

        <CheckoutModal
          isOpen={isModalOpen}
          price={priceFormatted}
          title={product.title}
          onCancel={() => setIsModalOpen(false)}
          onConfirm={handleConfirm}
        />
      </main>
    </>
  );
}
