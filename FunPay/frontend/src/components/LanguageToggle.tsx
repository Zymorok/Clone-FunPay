import { useLanguage, type Language } from "../i18n";

const nextLanguage: Record<Language, Language> = {
  uk: "ru",
  ru: "en",
  en: "uk"
};

export function LanguageToggle() {
  const { language, t, tFor, toggleLanguage } = useLanguage();
  const targetLanguage = nextLanguage[language];

  return (
    <button
      aria-label={`${t("language.switchTo")}: ${tFor(targetLanguage, "language.name")}`}
      className="language-toggle"
      onClick={toggleLanguage}
      title={`${t("language.switchTo")}: ${tFor(targetLanguage, "language.name")}`}
      type="button"
    >
      <span aria-hidden="true" className={`language-toggle__flag language-toggle__flag--${language}`} />
    </button>
  );
}
