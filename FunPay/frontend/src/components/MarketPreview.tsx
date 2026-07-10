import { ArrowRight, Star } from "lucide-react";
import { useLanguage } from "../i18n";

const animationAssets = "/assets/website/animations";

const featureAssets = {
  catalog: `${animationAssets}/characters/cute-animal-play-games.svg`,
  orders: `${animationAssets}/icons/security-safe-data-lock.svg`,
  chat: `${animationAssets}/icons/chat.svg`,
  fast: `${animationAssets}/icons/fast-thunder-yellow.svg`
};

const offerImages = [
  "/assets/website/offers/assets_counter_strike_2.png",
  "/assets/website/offers/assets_valorant.png",
  "/assets/website/offers/assets_rust.png",
  "/assets/website/offers/assets_albion_online.jpeg",
  "/assets/website/offers/assets_dota_2.jpg",
  "/assets/website/offers/assets_gta_v.jpg"
];

export function MarketPreview() {
  const { t } = useLanguage();
  const features = [
    {
      icon: featureAssets.catalog,
      title: t("market.features.catalog.title"),
      text: t("market.features.catalog.text")
    },
    {
      icon: featureAssets.orders,
      title: t("market.features.orders.title"),
      text: t("market.features.orders.text")
    },
    {
      icon: featureAssets.chat,
      title: t("market.features.chat.title"),
      text: t("market.features.chat.text")
    },
    {
      icon: featureAssets.fast,
      title: t("market.features.fast.title"),
      text: t("market.features.fast.text")
    }
  ];

  const offers = [
    {
      image: offerImages[0],
      title: "Counter-Strike 2",
      type: t("market.offerTypes.account"),
      price: "499 ₽",
      rating: "4.9 · 128"
    },
    {
      image: offerImages[1],
      title: "Valorant",
      type: t("market.offerTypes.account"),
      price: "299 ₽",
      rating: "4.8 · 95"
    },
    {
      image: offerImages[2],
      title: "RUST",
      type: t("market.offerTypes.key"),
      price: "799 ₽",
      rating: "4.7 · 67"
    },
    {
      image: offerImages[3],
      title: "Albion Online",
      type: t("market.offerTypes.silver"),
      price: "1 250 ₽",
      rating: "4.9 · 142"
    },
    {
      image: offerImages[4],
      title: "Dota 2",
      type: t("market.offerTypes.calibration"),
      price: "890 ₽",
      rating: "4.8 · 101"
    },
    {
      image: offerImages[5],
      title: "GTA V",
      type: t("market.offerTypes.account"),
      price: "699 ₽",
      rating: "4.7 · 74"
    }
  ];
  const carouselOffers = [...offers, ...offers];

  return (
    <section className="hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] lg:block">
      <h2 className="text-xl font-extrabold tracking-normal text-[var(--text)]">
        {t("market.title")}
      </h2>

      <div className="mt-4 grid gap-3">
        {features.map(({ icon, title, text }) => (
          <article className="grid grid-cols-[44px_1fr] items-center gap-4" key={title}>
            <span className="market-feature-icon grid size-11 place-items-center rounded-lg border border-[var(--border)] bg-[var(--feature-icon-bg)] shadow-sm">
              <img
                alt=""
                aria-hidden="true"
                className="pointer-events-none size-9 object-contain"
                draggable="false"
                src={icon}
              />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-[var(--text)]">{title}</h3>
              <p className="text-[13px] leading-5 text-[var(--muted)]">{text}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 border-t border-[var(--border)] pt-5">
        <h2 className="text-lg font-extrabold text-[var(--text)]">{t("market.popularOffers")}</h2>
        <div className="offer-carousel mt-4" aria-label={t("market.popularOffers")}>
          <div className="offer-track">
            {carouselOffers.map((offer, index) => (
              <article
                className="offer-card relative flex aspect-[1.35] min-h-[134px] flex-col justify-end overflow-hidden rounded-lg border border-[var(--border)] p-3 text-white shadow-sm"
                key={`${offer.title}-${index}`}
              >
                <img
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                  draggable="false"
                  src={offer.image}
                />
                <span className="absolute inset-0 bg-[var(--offer-overlay)]" />
                <h3 className="relative text-sm font-extrabold leading-tight">{offer.title}</h3>
                <p className="relative text-xs leading-4 text-white/82">{offer.type}</p>
                <div className="relative mt-3 flex items-center justify-between gap-2">
                  <span className="text-sm font-extrabold">{offer.price}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-white/82">
                    <Star size={11} fill="currentColor" aria-hidden="true" />
                    {offer.rating}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <a
        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-3 rounded-lg border border-[var(--border)] text-sm font-extrabold text-[var(--link)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
        href="/catalog"
      >
        {t("market.goCatalog")}
        <ArrowRight size={17} aria-hidden="true" />
      </a>
    </section>
  );
}
