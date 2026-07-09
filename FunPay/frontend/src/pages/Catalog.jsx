import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpDown,
  ChevronRight,
  Gamepad2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tags
} from "lucide-react";

const saleCategories = [
  { label: "Аккаунты", slug: "accounts" },
  { label: "Услуги", slug: "services" },
  { label: "Обучение", slug: "training" },
  { label: "Подписка", slug: "subscription" },
  { label: "Валюта", slug: "currency" },
  { label: "Донат", slug: "donate" },
  { label: "Предметы", slug: "items" },
  { label: "Twitch Drops", slug: "twitch-drops" },
  { label: "Ключи", slug: "keys" },
  { label: "Оффлайн активации", slug: "offline-activation" },
  { label: "Прочее", slug: "other" },
  { label: "Гайды", slug: "guides" },
  { label: "Game Pass", slug: "game-pass" },
  { label: "Кинары", slug: "kinars" },
  { label: "Вирты", slug: "virts" },
  { label: "Смена региона", slug: "region-change" }
];

const saleCategoryBySlug = new Map(
  saleCategories.map((category) => [category.slug, category])
);

const quickCategorySlugs = ["accounts", "services", "currency", "items"];
const filterPreviewSlugs = ["accounts", "services", "currency", "items", "training", "subscription"];

const games = [
  {
    title: "Counter-Strike 2",
    slug: "counter-strike-2",
    image: "/assets/website/offers/assets_counter_strike_2.png",
    accent: "from-[#273f63] to-[#111827]",
    allowedCategorySlugs: ["accounts", "services", "training", "currency", "items", "keys", "guides", "other"]
  },
  {
    title: "Valorant",
    slug: "valorant",
    image: "/assets/website/offers/assets_valorant.png",
    accent: "from-[#4a1625] to-[#111827]",
    allowedCategorySlugs: ["accounts", "services", "training", "currency", "donate", "items", "twitch-drops", "keys", "other"]
  },
  {
    title: "Dota 2",
    slug: "dota-2",
    image: "/assets/website/offers/assets_dota_2.jpg",
    accent: "from-[#3a1d15] to-[#111827]",
    allowedCategorySlugs: ["accounts", "services", "training", "currency", "donate", "items", "guides", "other"]
  },
  {
    title: "Rust",
    slug: "rust",
    image: "/assets/website/offers/assets_rust.png",
    accent: "from-[#4b2a17] to-[#111827]",
    allowedCategorySlugs: ["accounts", "services", "currency", "donate", "items", "keys", "other"]
  },
  {
    title: "Albion Online",
    slug: "albion-online",
    image: "/assets/website/offers/assets_albion_online.jpeg",
    accent: "from-[#183b2b] to-[#111827]",
    allowedCategorySlugs: ["accounts", "services", "training", "currency", "donate", "items", "kinars", "guides", "other"]
  },
  {
    title: "Grand Theft Auto V",
    slug: "grand-theft-auto-v",
    image: "/assets/website/offers/assets_gta_v.jpg",
    accent: "from-[#23402d] to-[#111827]",
    allowedCategorySlugs: ["accounts", "services", "currency", "donate", "virts", "region-change", "other"]
  },
  {
    title: "Minecraft",
    slug: "minecraft",
    image: "/assets/website/offers/assets_rust.png",
    accent: "from-[#23422d] to-[#111827]",
    allowedCategorySlugs: ["accounts", "services", "training", "currency", "donate", "items", "keys", "guides", "other"]
  },
  {
    title: "Genshin Impact",
    slug: "genshin-impact",
    image: "/assets/website/offers/assets_valorant.png",
    accent: "from-[#253a62] to-[#111827]",
    allowedCategorySlugs: ["accounts", "services", "training", "subscription", "currency", "donate", "other"]
  },
  {
    title: "World of Warcraft",
    slug: "world-of-warcraft",
    image: "/assets/website/offers/assets_albion_online.jpeg",
    accent: "from-[#243d54] to-[#111827]",
    allowedCategorySlugs: ["accounts", "services", "training", "currency", "items", "guides", "game-pass", "other"]
  },
  {
    title: "Apex Legends",
    slug: "apex-legends",
    image: "/assets/website/offers/assets_counter_strike_2.png",
    accent: "from-[#5a231e] to-[#111827]",
    allowedCategorySlugs: ["accounts", "services", "training", "currency", "items", "twitch-drops", "other"]
  },
  {
    title: "League of Legends",
    slug: "league-of-legends",
    image: "/assets/website/offers/assets_dota_2.jpg",
    accent: "from-[#17364d] to-[#111827]",
    allowedCategorySlugs: ["accounts", "services", "training", "currency", "items", "guides", "other"]
  },
  {
    title: "Escape from Tarkov",
    slug: "escape-from-tarkov",
    image: "/assets/website/offers/assets_gta_v.jpg",
    accent: "from-[#3d3325] to-[#111827]",
    allowedCategorySlugs: ["accounts", "services", "currency", "items", "keys", "offline-activation", "guides", "other"]
  }
];

const filterPreviewCategories = filterPreviewSlugs
  .map((slug) => saleCategoryBySlug.get(slug))
  .filter(Boolean);

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function getCategoriesBySlugs(slugs) {
  return slugs.map((slug) => saleCategoryBySlug.get(slug)).filter(Boolean);
}

function getAllowedCategories(game) {
  return getCategoriesBySlugs(game.allowedCategorySlugs);
}

function getQuickCategories(game) {
  const allowedSlugSet = new Set(game.allowedCategorySlugs);

  return quickCategorySlugs
    .filter((slug) => allowedSlugSet.has(slug))
    .map((slug) => saleCategoryBySlug.get(slug))
    .filter(Boolean);
}

function getCategoryHref(game, category) {
  return `/catalog/${game.slug}/${category.slug}`;
}

export function Catalog() {
  const [panelMode, setPanelMode] = useState("filters");
  const [selectedGame, setSelectedGame] = useState(null);

  function showDefaultFilters() {
    setSelectedGame(null);
    setPanelMode("filters");
  }

  function showGameCategories(game) {
    setSelectedGame(game);
    setPanelMode("game-categories");
  }

  function showAllCategories() {
    setSelectedGame(null);
    setPanelMode("all-categories");
  }

  return (
    <main className="catalog-page mx-auto grid max-w-[1260px] gap-5 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0">
        <div className="catalog-hero overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
          <video
            aria-hidden="true"
            autoPlay
            className="catalog-hero__video"
            loop
            muted
            playsInline
            src="/assets/website/backgrounds/routes/background_catalog.webm"
          />
          <div className="catalog-hero__content">
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/16 bg-black/20 px-3 py-2 text-sm font-bold text-white/84 backdrop-blur">
              <Gamepad2 size={16} aria-hidden="true" />
              Каталог игр
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight text-white sm:text-5xl">
              Выберите игру
            </h1>
            <p className="mt-3 max-w-[640px] text-base leading-7 text-white/76">
              Игровые разделы для будущих объявлений, заказов и быстрых сделок.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black tracking-normal text-[var(--text)]">Все игры</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Быстрые категории на карточке и полный список справа
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-extrabold text-[var(--text)] shadow-sm"
              type="button"
            >
              <Star size={16} aria-hidden="true" />
              Популярные
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-extrabold text-[var(--text)] shadow-sm"
              type="button"
            >
              <ArrowUpDown size={16} aria-hidden="true" />
              A-Z
            </button>
          </div>
        </div>

        <div className="catalog-grid mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => {
            const allowedCategories = getAllowedCategories(game);
            const quickCategories = getQuickCategories(game);

            return (
              <article
                className="catalog-game-card group overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]"
                key={game.title}
              >
                <div className={`relative aspect-[1.54] overflow-hidden bg-gradient-to-br ${game.accent}`}>
                  <img
                    alt=""
                    className="absolute inset-0 size-full object-cover opacity-78 transition duration-300 group-hover:scale-105 group-hover:opacity-88"
                    draggable="false"
                    src={game.image}
                  />
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,7,14,0.02),rgba(2,7,14,0.82))]" />
                  <span className="absolute left-3 top-3 rounded-lg border border-white/16 bg-black/36 px-2.5 py-1 text-xs font-extrabold text-white backdrop-blur">
                    {allowedCategories.length} разделов
                  </span>
                </div>

                <div className="grid min-h-[138px] gap-4 p-4">
                  <h3 className="truncate text-lg font-black tracking-normal text-[var(--text)]">
                    {game.title}
                  </h3>

                  <div className="flex items-end justify-between gap-3">
                    <div className="catalog-card-links" aria-label={`Быстрые категории ${game.title}`}>
                      {quickCategories.map((category) => (
                        <a
                          className="catalog-category-link"
                          href={getCategoryHref(game, category)}
                          key={category.slug}
                        >
                          {category.label}
                        </a>
                      ))}
                    </div>

                    <button
                      aria-label={`Показать разрешенные категории для ${game.title}`}
                      className="catalog-category-arrow grid size-10 shrink-0 place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)] transition group-hover:border-[var(--accent)] group-hover:text-[var(--accent-strong)]"
                      onClick={() => showGameCategories(game)}
                      type="button"
                    >
                      <ChevronRight size={18} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="catalog-filter-panel h-fit rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] lg:sticky lg:top-4">
        {panelMode === "game-categories" && selectedGame ? (
          <GameCategoryPanel
            categories={getAllowedCategories(selectedGame)}
            game={selectedGame}
            onBack={showDefaultFilters}
          />
        ) : panelMode === "all-categories" ? (
          <AllCategoriesPanel onBack={showDefaultFilters} />
        ) : (
          <DefaultFilterPanel onOpenCategories={showAllCategories} />
        )}
      </aside>
    </main>
  );
}

function DefaultFilterPanel({ onOpenCategories }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-[var(--surface-strong)] text-[var(--accent-strong)]">
            <SlidersHorizontal size={18} aria-hidden="true" />
          </span>
          <h2 className="text-xl font-black text-[var(--text)]">Фильтры</h2>
        </div>

        <button
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-xs font-extrabold text-[var(--muted)]"
          type="button"
        >
          <RotateCcw size={14} aria-hidden="true" />
          Сбросить
        </button>
      </div>

      <label className="mt-5 grid gap-2">
        <span className="text-sm font-extrabold text-[var(--text)]">Поиск</span>
        <span className="relative block">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={18}
            aria-hidden="true"
          />
          <input className="field" placeholder="Название игры" type="search" />
        </span>
      </label>

      <section className="mt-6 border-t border-[var(--border)] pt-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={17} className="text-[var(--accent-strong)]" aria-hidden="true" />
          <h3 className="text-sm font-extrabold uppercase text-[var(--muted)]">A-Z</h3>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {alphabet.map((letter) => (
            <button
              className="grid h-9 place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-xs font-black text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
              key={letter}
              type="button"
            >
              {letter}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 border-t border-[var(--border)] pt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Tags size={17} className="text-[var(--accent-strong)]" aria-hidden="true" />
            <h3 className="text-sm font-extrabold uppercase text-[var(--muted)]">Категории продаж</h3>
          </div>
          <button
            aria-label="Показать все категории продаж"
            className="catalog-filter-arrow grid size-9 place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
            onClick={onOpenCategories}
            type="button"
          >
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        </div>

        <div className="catalog-filter-quick-list">
          {filterPreviewCategories.map((category) => (
            <button className="catalog-filter-chip" key={category.slug} type="button">
              {category.label}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function AllCategoriesPanel({ onBack }) {
  return (
    <>
      <PanelTitle
        icon={<Tags size={18} aria-hidden="true" />}
        subtitle="Общий список фильтров"
        title="Категории продаж"
      />
      <PanelActions onBack={onBack} />
      <CategorySearch placeholder="Например услуги" />

      <div className="mt-5 grid gap-2">
        {saleCategories.map((category) => (
          <button className="catalog-full-category-link" key={category.slug} type="button">
            <span>{category.label}</span>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        ))}
      </div>
    </>
  );
}

function GameCategoryPanel({ categories, game, onBack }) {
  return (
    <>
      <PanelTitle
        icon={<Tags size={18} aria-hidden="true" />}
        subtitle="Разрешенные категории для игры"
        title={game.title}
      />
      <PanelActions onBack={onBack} />
      <CategorySearch placeholder="Например услуги" />

      <div className="mt-5 grid gap-2">
        {categories.map((category) => (
          <a className="catalog-full-category-link" href={getCategoryHref(game, category)} key={category.slug}>
            <span>{category.label}</span>
            <ChevronRight size={16} aria-hidden="true" />
          </a>
        ))}
      </div>
    </>
  );
}

function PanelTitle({ icon, subtitle, title }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-[var(--surface-strong)] text-[var(--accent-strong)]">
            {icon}
          </span>
          <h2 className="truncate text-xl font-black text-[var(--text)]">{title}</h2>
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">{subtitle}</p>
      </div>
    </div>
  );
}

function PanelActions({ onBack }) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-2">
      <button
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-sm font-extrabold text-[var(--text)]"
        onClick={onBack}
        type="button"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Назад
      </button>
      <button
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-sm font-extrabold text-[var(--muted)]"
        onClick={onBack}
        type="button"
      >
        <RotateCcw size={14} aria-hidden="true" />
        Сбросить
      </button>
    </div>
  );
}

function CategorySearch({ placeholder }) {
  return (
    <label className="mt-5 grid gap-2 border-t border-[var(--border)] pt-5">
      <span className="text-sm font-extrabold text-[var(--text)]">Поиск категории</span>
      <span className="relative block">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          size={18}
          aria-hidden="true"
        />
        <input className="field" placeholder={placeholder} type="search" />
      </span>
    </label>
  );
}
