import { Languages, Palette, Settings2, X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { Theme } from "../app/theme";
import { useLanguage } from "../i18n";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { useAnimatedDialog } from "./useAnimatedDialog";

type AccountSettingsDialogProps = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onClose: () => void;
};

export function AccountSettingsDialog({ theme, onThemeChange, onClose }: AccountSettingsDialogProps) {
  const { t } = useLanguage();
  const { isClosing, requestClose } = useAnimatedDialog(onClose);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [requestClose]);

  return createPortal(
    <div
      aria-label={t("userMenu.settingsTitle")}
      aria-modal="true"
      className={`account-settings${isClosing ? " modal-layer--closing" : ""}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          requestClose();
        }
      }}
      role="dialog"
    >
      <section className="account-settings__sheet">
        <header className="account-settings__head">
          <div>
            <span className="account-settings__kicker">
              <Settings2 size={15} aria-hidden="true" />
              {t("userMenu.settings")}
            </span>
            <h2>{t("userMenu.settingsTitle")}</h2>
            <p>{t("userMenu.settingsSubtitle")}</p>
          </div>
          <button className="profile-icon-button" onClick={requestClose} type="button" aria-label={t("userMenu.closeSettings")}>
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="account-settings__grid">
          <article className="account-settings__card">
            <span className="account-settings__icon"><Languages size={22} aria-hidden="true" /></span>
            <div className="account-settings__copy">
              <strong>{t("userMenu.language")}</strong>
              <p>{t("userMenu.languageHint")}</p>
              <small>{t("language.name")}</small>
            </div>
            <LanguageToggle />
          </article>

          <article className="account-settings__card">
            <span className="account-settings__icon"><Palette size={22} aria-hidden="true" /></span>
            <div className="account-settings__copy">
              <strong>{t("userMenu.theme")}</strong>
              <p>{t("userMenu.themeHint")}</p>
              <small>{t(theme === "dark" ? "userMenu.themeDark" : "userMenu.themeLight")}</small>
            </div>
            <ThemeToggle theme={theme} onThemeChange={onThemeChange} />
          </article>
        </div>
      </section>
    </div>,
    document.body
  );
}
