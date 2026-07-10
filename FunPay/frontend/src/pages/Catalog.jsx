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
import { useLanguage } from "../i18n";

const saleCategories = [
  { slug: "accounts" },
  { slug: "services" },
  { slug: "training" },
  { slug: "subscription" },
  { slug: "currency" },
  { slug: "donate" },
  { slug: "items" },
  { slug: "twitch-drops" },
  { slug: "keys" },
  { slug: "offline-activation" },
  { slug: "other" },
  { slug: "guides" },
  { slug: "game-pass" },
  { slug: "kinars" },
  { slug: "virts" },
  { slug: "region-change" }
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

function getCategoryLabel(t, category) {
  return t(`catalog.categories.${category.slug}`);
}

export function Catalog() {
  const { t } = useLanguage();
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
              {t("catalog.heroLabel")}
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight text-white sm:text-5xl">
              {t("catalog.title")}
            </h1>
            <p className="mt-3 max-w-[640px] text-base leading-7 text-white/76">
              {t("catalog.subtitle")}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black tracking-normal text-[var(--text)]">{t("catalog.allGames")}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {t("catalog.allGamesSubtitle")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-extrabold text-[var(--text)] shadow-sm"
              type="button"
            >
              <Star size={16} aria-hidden="true" />
              {t("catalog.popular")}
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-extrabold text-[var(--text)] shadow-sm"
              type="button"
            >
              <ArrowUpDown size={16} aria-hidden="true" />
              {t("catalog.az")}
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
                    {t("catalog.sectionsCount", { count: allowedCategories.length })}
                  </span>
                </div>

                <div className="grid min-h-[138px] gap-4 p-4">
                  <h3 className="truncate text-lg font-black tracking-normal text-[var(--text)]">
                    {game.title}
                  </h3>

                  <div className="flex items-end justify-between gap-3">
                    <div className="catalog-card-links" aria-label={t("catalog.quickCategoriesAria", { game: game.title })}>
                      {quickCategories.map((category) => (
                        <a
                          className="catalog-category-link"
                          href={getCategoryHref(game, category)}
                          key={category.slug}
                        >
                          {getCategoryLabel(t, category)}
                        </a>
                      ))}
                    </div>

                    <button
                      aria-label={t("catalog.showAllowedCategories", { game: game.title })}
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
  const { t } = useLanguage();

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-[var(--surface-strong)] text-[var(--accent-strong)]">
            <SlidersHorizontal size={18} aria-hidden="true" />
          </span>
          <h2 className="text-xl font-black text-[var(--text)]">{t("catalog.filters")}</h2>
        </div>

        <button
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-xs font-extrabold text-[var(--muted)]"
          type="button"
        >
          <RotateCcw size={14} aria-hidden="true" />
          {t("catalog.reset")}
        </button>
      </div>

      <label className="mt-5 grid gap-2">
        <span className="text-sm font-extrabold text-[var(--text)]">{t("catalog.search")}</span>
        <span className="relative block">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={18}
            aria-hidden="true"
          />
          <input className="field" placeholder={t("catalog.searchPlaceholder")} type="search" />
        </span>
      </label>

      <section className="mt-6 border-t border-[var(--border)] pt-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={17} className="text-[var(--accent-strong)]" aria-hidden="true" />
          <h3 className="text-sm font-extrabold uppercase text-[var(--muted)]">{t("catalog.az")}</h3>
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
            <h3 className="text-sm font-extrabold uppercase text-[var(--muted)]">{t("catalog.saleCategories")}</h3>
          </div>
          <button
            aria-label={t("catalog.saleCategoriesAria")}
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
              {getCategoryLabel(t, category)}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function AllCategoriesPanel({ onBack }) {
  const { t } = useLanguage();

  return (
    <>
      <PanelTitle
        icon={<Tags size={18} aria-hidden="true" />}
        subtitle={t("catalog.allCategoriesSubtitle")}
        title={t("catalog.saleCategories")}
      />
      <PanelActions onBack={onBack} />
      <CategorySearch placeholder={t("catalog.categorySearchPlaceholder")} />

      <div className="mt-5 grid gap-2">
        {saleCategories.map((category) => (
          <button className="catalog-full-category-link" key={category.slug} type="button">
            <span>{getCategoryLabel(t, category)}</span>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        ))}
      </div>
    </>
  );
}

function GameCategoryPanel({ categories, game, onBack }) {
  const { t } = useLanguage();

  return (
    <>
      <PanelTitle
        icon={<Tags size={18} aria-hidden="true" />}
        subtitle={t("catalog.allowedCategoriesSubtitle")}
        title={game.title}
      />
      <PanelActions onBack={onBack} />
      <CategorySearch placeholder={t("catalog.categorySearchPlaceholder")} />

      <div className="mt-5 grid gap-2">
        {categories.map((category) => (
          <a className="catalog-full-category-link" href={getCategoryHref(game, category)} key={category.slug}>
            <span>{getCategoryLabel(t, category)}</span>
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
  const { t } = useLanguage();

  return (
    <div className="mt-5 grid grid-cols-2 gap-2">
      <button
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-sm font-extrabold text-[var(--text)]"
        onClick={onBack}
        type="button"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {t("catalog.back")}
      </button>
      <button
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-sm font-extrabold text-[var(--muted)]"
        onClick={onBack}
        type="button"
      >
        <RotateCcw size={14} aria-hidden="true" />
        {t("catalog.reset")}
      </button>
    </div>
  );
}

function CategorySearch({ placeholder }) {
  const { t } = useLanguage();

  return (
    <label className="mt-5 grid gap-2 border-t border-[var(--border)] pt-5">
      <span className="text-sm font-extrabold text-[var(--text)]">{t("catalog.categorySearch")}</span>
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
