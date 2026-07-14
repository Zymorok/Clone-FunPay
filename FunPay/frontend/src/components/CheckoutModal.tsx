import { useEffect } from "react";
import { CheckCircle2, ShoppingCart, X } from "lucide-react";
import { useLanguage } from "../i18n";

type CheckoutModalProps = {
  isOpen: boolean;
  price: string;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CheckoutModal({ isOpen, price, title, onCancel, onConfirm }: CheckoutModalProps) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="checkout-backdrop"
      aria-modal="true"
      role="dialog"
      aria-describedby="checkout-description"
      aria-labelledby="checkout-title"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="checkout-modal">
        {/* Header */}
        <div className="checkout-modal__header">
          <span className="grid size-10 place-items-center rounded-lg bg-[var(--surface-strong)] text-[var(--accent-strong)]">
            <ShoppingCart size={20} aria-hidden="true" />
          </span>
          <h2 className="checkout-modal__title" id="checkout-title">
            {t("offer.checkout.title")}
          </h2>
          <button
            aria-label={t("offer.checkout.close")}
            autoFocus
            className="checkout-modal__close"
            onClick={onCancel}
            type="button"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="checkout-modal__body">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--muted)]">{t("offer.checkout.product")}</p>
            <p className="mt-1 text-sm font-extrabold text-[var(--text)] leading-snug">{title}</p>
          </div>

          <div className="mt-3 flex items-end justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-[var(--muted)]">{t("offer.checkout.total")}</p>
            <p className="text-2xl font-black text-[var(--text)]">
              {price}
              <span className="ml-1 text-base font-extrabold text-[var(--muted)]">₽</span>
            </p>
          </div>

          <p className="mt-4 text-xs leading-5 text-[var(--muted)]" id="checkout-description">
            {t("offer.checkout.protection")}
          </p>
        </div>

        {/* Actions */}
        <div className="checkout-modal__actions">
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-5 text-sm font-extrabold text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
            onClick={onCancel}
            type="button"
          >
            {t("offer.checkout.cancel")}
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 text-sm font-extrabold text-[var(--accent-text)] shadow-sm transition hover:bg-[var(--accent-strong)]"
            onClick={onConfirm}
            type="button"
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            {t("offer.checkout.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
