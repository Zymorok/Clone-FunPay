import { ArrowRight, Star } from "lucide-react";

const animationAssets = "/assets/website/animations";

const features = [
  {
    icon: `${animationAssets}/characters/cute-animal-play-games.svg`,
    title: "Каталог игр и товаров",
    text: "Тысячи предложений по популярным играм"
  },
  {
    icon: `${animationAssets}/icons/security-safe-data-lock.svg`,
    title: "Безопасные заказы",
    text: "Система заказов с защитой покупателя"
  },
  {
    icon: `${animationAssets}/icons/chat.svg`,
    title: "Чат с продавцом",
    text: "Общайтесь прямо в заказе"
  },
  {
    icon: `${animationAssets}/icons/fast-thunder-yellow.svg`,
    title: "Быстро и удобно",
    text: "Мгновенные уведомления и простой интерфейс"
  }
];

const offers = [
  {
    image: "/assets/website/offers/assets_counter_strike_2.png",
    title: "Counter-Strike 2",
    type: "Аккаунт",
    price: "499 ₽",
    rating: "4.9 · 128"
  },
  {
    image: "/assets/website/offers/assets_valorant.png",
    title: "Valorant",
    type: "Аккаунт",
    price: "299 ₽",
    rating: "4.8 · 95"
  },
  {
    image: "/assets/website/offers/assets_rust.png",
    title: "RUST",
    type: "Ключ",
    price: "799 ₽",
    rating: "4.7 · 67"
  }
];

export function MarketPreview() {
  return (
    <section className="hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] lg:block">
      <h2 className="text-xl font-extrabold tracking-normal text-[var(--text)]">
        Всё для ваших игровых сделок
      </h2>

      <div className="mt-4 grid gap-3">
        {features.map(({ icon, title, text }) => (
          <article className="grid grid-cols-[44px_1fr] items-center gap-4" key={title}>
            <span className="grid size-11 place-items-center rounded-lg border border-[var(--border)] bg-[var(--feature-icon-bg)] shadow-sm">
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
        <h2 className="text-lg font-extrabold text-[var(--text)]">Популярные предложения</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {offers.map((offer) => (
            <article
              className="relative flex aspect-[1.35] min-h-[134px] flex-col justify-end overflow-hidden rounded-lg border border-[var(--border)] p-3 text-white shadow-sm"
              key={offer.title}
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

      <a
        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-3 rounded-lg border border-[var(--border)] text-sm font-extrabold text-[var(--link)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
        href="#catalog"
      >
        Перейти в каталог
        <ArrowRight size={17} aria-hidden="true" />
      </a>
    </section>
  );
}
