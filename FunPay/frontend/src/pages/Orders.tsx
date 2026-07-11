import {
  BadgeCheck,
  Check,
  ChevronRight,
  CircleDashed,
  Clock3,
  Headphones,
  MessageCircle,
  PackageCheck,
  ReceiptText,
  Search,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
  WalletCards
} from "lucide-react";
import { useLanguage } from "../i18n";

const ordersVideo = "/assets/website/backgrounds/routes/background_orders.webm";

const orderItems = [
  {
    id: "FP-24901",
    image: "/assets/website/offers/assets_counter_strike_2.png",
    titleKey: "routes.orders.items.neonRider",
    metaKey: "routes.orders.items.neonRiderMeta",
    seller: "SkinVault",
    sellerAvatar: "/assets/website/profile-cosmetics/animated-thumbnails/avatars/100/100__spider-man-noir__cover.webp",
    sellerFrame: "/assets/website/profile-cosmetics/frames/05/005__magic-bubble__cover.webp",
    price: "4 999 ₽",
    dateKey: "routes.orders.dates.today",
    statusKey: "routes.orders.status.awaiting",
    status: "awaiting"
  },
  {
    id: "FP-24877",
    image: "/assets/website/offers/assets_valorant.png",
    titleKey: "routes.orders.items.valorantPoints",
    metaKey: "routes.orders.items.valorantPointsMeta",
    seller: "neon.market",
    sellerAvatar: "/assets/website/profile-cosmetics/animated-thumbnails/avatars/02/002__reze__cover.webp",
    sellerFrame: "/assets/website/profile-cosmetics/frames/02/002__icicles__cover.webp",
    price: "1 290 ₽",
    dateKey: "routes.orders.dates.yesterday",
    statusKey: "routes.orders.status.progress",
    status: "progress"
  },
  {
    id: "FP-24764",
    image: "/assets/website/offers/assets_dota_2.jpg",
    titleKey: "routes.orders.items.dotaCoaching",
    metaKey: "routes.orders.items.dotaCoachingMeta",
    seller: "highground",
    sellerAvatar: "/assets/website/profile-cosmetics/animated-thumbnails/avatars/06/006__dr-livesey__cover.webp",
    sellerFrame: "/assets/website/profile-cosmetics/frames/04/004__endless-vortex__cover.webp",
    price: "890 ₽",
    dateKey: "routes.orders.dates.julyEight",
    statusKey: "routes.orders.status.completed",
    status: "completed"
  },
  {
    id: "FP-24619",
    image: "/assets/website/offers/assets_gta_v.jpg",
    titleKey: "routes.orders.items.gtaAccount",
    metaKey: "routes.orders.items.gtaAccountMeta",
    seller: "west-coast",
    sellerAvatar: "/assets/website/profile-cosmetics/animated-thumbnails/avatars/09/009__two-tails__cover.webp",
    sellerFrame: "/assets/website/profile-cosmetics/frames/06/006__yuji-technique__cover.webp",
    price: "2 450 ₽",
    dateKey: "routes.orders.dates.julyFive",
    statusKey: "routes.orders.status.review",
    status: "review"
  }
] as const;

const statusIcons = {
  awaiting: Clock3,
  progress: CircleDashed,
  completed: PackageCheck,
  review: TriangleAlert
};

export function Orders() {
  const { t } = useLanguage();

  return (
    <main className="orders-page">
      <video
        aria-hidden="true"
        autoPlay
        className="orders-page__video"
        loop
        muted
        playsInline
        src={ordersVideo}
      />
      <div className="orders-page__shade" />

      <div className="orders-shell">
        <header className="orders-heading">
          <div>
            <div className="orders-heading__icon" aria-hidden="true">
              <ReceiptText size={23} strokeWidth={2.2} />
            </div>
            <div>
              <h1>{t("routes.orders.title")}</h1>
              <p>{t("routes.orders.subtitle")}</p>
            </div>
          </div>

        </header>

        <section className="orders-summary" aria-label={t("routes.orders.summaryLabel")}>
          <article className="orders-summary__item orders-summary__item--active">
            <span className="orders-summary__visual" aria-hidden="true">
              <Clock3 size={20} />
            </span>
            <span>
              <small>{t("routes.orders.summary.active")}</small>
              <strong>2</strong>
            </span>
            <span className="orders-summary__trend">+1</span>
          </article>

          <article className="orders-summary__item">
            <span className="orders-summary__visual" aria-hidden="true">
              <PackageCheck size={20} />
            </span>
            <span>
              <small>{t("routes.orders.summary.completed")}</small>
              <strong>24</strong>
            </span>
            <span className="orders-summary__note">{t("routes.orders.summary.allTime")}</span>
          </article>

          <article className="orders-summary__item">
            <span className="orders-summary__visual" aria-hidden="true">
              <WalletCards size={20} />
            </span>
            <span>
              <small>{t("routes.orders.summary.spent")}</small>
              <strong>32 480 ₽</strong>
            </span>
            <span className="orders-summary__note">{t("routes.orders.summary.allTime")}</span>
          </article>

          <article className="orders-summary__item orders-summary__item--success">
            <span className="orders-summary__visual" aria-hidden="true">
              <BadgeCheck size={20} />
            </span>
            <span>
              <small>{t("routes.orders.summary.successRate")}</small>
              <strong>{t("routes.orders.summary.successPercent")}</strong>
            </span>
          </article>
        </section>

        <div className="orders-layout">
          <section className="orders-panel orders-list-panel">
            <div className="orders-panel__topline">
              <div>
                <h2>{t("routes.orders.history")}</h2>
                <span>{t("routes.orders.historyCount")}</span>
              </div>
              <button className="orders-filter-button" type="button">
                <SlidersHorizontal size={16} aria-hidden="true" />
                {t("routes.orders.filters.label")}
              </button>
            </div>

            <div className="orders-toolbar">
              <div className="orders-tabs" role="tablist" aria-label={t("routes.orders.filters.label")}>
                <button aria-selected="true" className="orders-tab is-active" role="tab" type="button">
                  {t("routes.orders.filters.all")}
                  <span>28</span>
                </button>
                <button aria-selected="false" className="orders-tab" role="tab" type="button">
                  {t("routes.orders.filters.active")}
                  <span>2</span>
                </button>
                <button aria-selected="false" className="orders-tab" role="tab" type="button">
                  {t("routes.orders.filters.completed")}
                </button>
              </div>

              <label className="orders-search">
                <Search size={16} aria-hidden="true" />
                <input
                  aria-label={t("routes.orders.search")}
                  placeholder={t("routes.orders.search")}
                  readOnly
                  type="search"
                />
              </label>
            </div>

            <div className="orders-list">
              {orderItems.map((order) => {
                const StatusIcon = statusIcons[order.status];

                return (
                  <article className="order-row" key={order.id}>
                    <div className="order-row__image-wrap">
                      <img alt="" className="order-row__image" src={order.image} />
                    </div>

                    <div className="order-row__main">
                      <div className="order-row__eyebrow">
                        <span>{order.id}</span>
                        <span className={`order-status order-status--${order.status}`}>
                          <StatusIcon size={13} aria-hidden="true" />
                          {t(order.statusKey)}
                        </span>
                      </div>
                      <h3>{t(order.titleKey)}</h3>
                      <p>{t(order.metaKey)}</p>
                    </div>

                    <div className="order-row__seller">
                      <span className="order-row__avatar" aria-hidden="true">
                        <img className="order-row__avatar-media" src={order.sellerAvatar} alt="" />
                        <img className="order-row__avatar-frame" src={order.sellerFrame} alt="" />
                      </span>
                      <span>
                        <small>{t("routes.orders.seller")}</small>
                        <strong>{order.seller}</strong>
                      </span>
                    </div>

                    <div className="order-row__total">
                      <small>{t("routes.orders.total")}</small>
                      <strong>{order.price}</strong>
                      <span>{t(order.dateKey)}</span>
                    </div>

                    <a className="order-row__open" href="/chat" aria-label={t("routes.orders.openOrder", { id: order.id })}>
                      <ChevronRight size={19} aria-hidden="true" />
                    </a>
                  </article>
                );
              })}
            </div>

            <button className="orders-load-more" type="button">
              {t("routes.orders.showMore")}
              <span>24</span>
            </button>
          </section>

          <aside className="orders-sidebar">
            <section className="orders-panel orders-active-card">
              <div className="orders-active-card__head">
                <div>
                  <span className="orders-live-dot" />
                  {t("routes.orders.activeDeal")}
                </div>
                <span>#FP-24901</span>
              </div>

              <h2>{t("routes.orders.items.neonRider")}</h2>
              <p>{t("routes.orders.activeDealText")}</p>

              <ol className="orders-progress">
                <li className="is-done">
                  <span><Check size={13} aria-hidden="true" /></span>
                  <div>
                    <strong>{t("routes.orders.steps.paid")}</strong>
                    <small>18:42</small>
                  </div>
                </li>
                <li className="is-current">
                  <span><Sparkles size={13} aria-hidden="true" /></span>
                  <div>
                    <strong>{t("routes.orders.steps.seller")}</strong>
                    <small>{t("routes.orders.steps.now")}</small>
                  </div>
                </li>
                <li>
                  <span><PackageCheck size={13} aria-hidden="true" /></span>
                  <div>
                    <strong>{t("routes.orders.steps.delivery")}</strong>
                    <small>{t("routes.orders.steps.next")}</small>
                  </div>
                </li>
              </ol>

              <a className="orders-primary-action" href="/chat">
                <MessageCircle size={17} aria-hidden="true" />
                {t("routes.orders.writeSeller")}
              </a>
            </section>

            <section className="orders-help-card">
              <span className="orders-help-card__icon" aria-hidden="true">
                <Headphones size={20} />
              </span>
              <div>
                <h2>{t("routes.orders.help.title")}</h2>
                <p>{t("routes.orders.help.text")}</p>
              </div>
              <a href="/support" aria-label={t("routes.orders.help.action")}>
                <ChevronRight size={18} aria-hidden="true" />
              </a>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
