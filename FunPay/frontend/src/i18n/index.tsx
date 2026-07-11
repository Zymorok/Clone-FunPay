import JSON5 from "json5";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import appLocaleRaw from "./locales/app.json5?raw";
import englishLocaleRaw from "./locales/en.json5?raw";
import supplementalLocaleRaw from "./locales/supplemental.json5?raw";
import { runLanguageDustTransition } from "../shared/uiTransitions";

export const supportedLanguages = ["uk", "ru", "en"] as const;
export type Language = (typeof supportedLanguages)[number];

type LocalePrimitive = string | number | boolean | null;
type LocaleValue = LocalePrimitive | LocaleTree | LocaleArray;
interface LocaleArray extends Array<LocaleValue> {}
interface LocaleTree {
  [key: string]: LocaleValue;
}
type LocaleModule = {
  $meta?: {
    defaultLang?: Language;
    fallback?: Partial<Record<Language, Language[]>>;
  };
} & Partial<Record<Language, LocaleTree>>;
type LocaleBundle = Record<string, string>;
type TranslateParams = Record<string, string | number>;
export type Translate = (key: string, params?: TranslateParams) => string;

const languageStorageKey = "funpay-language";
const localeModule = JSON5.parse(appLocaleRaw) as LocaleModule;
const englishLocale = JSON5.parse(englishLocaleRaw) as LocaleTree;
const supplementalLocale = JSON5.parse(supplementalLocaleRaw) as Partial<Record<Language, LocaleTree>>;
const defaultLanguage = localeModule.$meta?.defaultLang ?? "uk";
const languageFallbacks: Partial<Record<Language, Language[]>> = {
  ...localeModule.$meta?.fallback,
  en: ["ru", "uk"]
};

function isLanguage(value: string | null): value is Language {
  return supportedLanguages.includes(value as Language);
}

function flattenLocale(tree: LocaleTree, parent = ""): LocaleBundle {
  return Object.entries(tree).reduce<LocaleBundle>((bundle, [key, value]) => {
    const fullKey = parent ? `${parent}.${key}` : key;

    if (Array.isArray(value)) {
      bundle[fullKey] = value.map(String).join("");
      return bundle;
    }

    if (value && typeof value === "object") {
      Object.assign(bundle, flattenLocale(value as LocaleTree, fullKey));
      return bundle;
    }

    bundle[fullKey] = value == null ? "" : String(value);
    return bundle;
  }, {});
}

const bundles = supportedLanguages.reduce<Record<Language, LocaleBundle>>((result, language) => {
  const primaryLocale = language === "en" ? englishLocale : localeModule[language] ?? {};
  result[language] = flattenLocale({ ...primaryLocale, ...supplementalLocale[language] });
  return result;
}, {} as Record<Language, LocaleBundle>);

function buildFallbackChain(language: Language) {
  return [
    language,
    ...(languageFallbacks[language] ?? []),
    defaultLanguage,
    ...supportedLanguages
  ].filter((item, index, list): item is Language => isLanguage(item) && list.indexOf(item) === index);
}

function formatTemplate(template: string, params?: TranslateParams) {
  if (!params) {
    return template;
  }

  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match;
  });
}

export function translate(language: Language, key: string, params?: TranslateParams) {
  for (const candidate of buildFallbackChain(language)) {
    const value = bundles[candidate][key];

    if (value !== undefined) {
      return formatTemplate(value, params);
    }
  }

  return key;
}

function getInitialLanguage(): Language {
  const savedLanguage = localStorage.getItem(languageStorageKey);

  if (isLanguage(savedLanguage)) {
    return savedLanguage;
  }

  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
  const browserLanguage = browserLanguages
    .map((language) => language.toLowerCase().split("-")[0])
    .find((language): language is Language => isLanguage(language));

  return browserLanguage ?? defaultLanguage;
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: Translate;
  tFor: (language: Language, key: string, params?: TranslateParams) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setCurrentLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem(languageStorageKey, language);
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback<Translate>(
    (key, params) => translate(language, key, params),
    [language]
  );

  const setLanguage = useCallback((nextLanguage: Language) => {
    if (nextLanguage === language) {
      return;
    }

    runLanguageDustTransition(() => setCurrentLanguage(nextLanguage));
  }, [language]);

  const toggleLanguage = useCallback(() => {
    runLanguageDustTransition(() => {
      setCurrentLanguage((current) => {
        const currentIndex = supportedLanguages.indexOf(current);
        return supportedLanguages[(currentIndex + 1) % supportedLanguages.length];
      });
    });
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    return {
      language,
      setLanguage,
      toggleLanguage,
      t,
      tFor: translate
    };
  }, [language, setLanguage, t, toggleLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
