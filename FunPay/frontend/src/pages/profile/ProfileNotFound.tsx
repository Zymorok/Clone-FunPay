import { CircleUserRound, Compass, RefreshCw, SearchX } from "lucide-react";
import { useLanguage } from "../../i18n";
import { navigateTo } from "../../shared/navigation";

const profileMissingEmoji = "/assets/website/emojis/sets/01/001__senkuro-mini__emoji_011__senkuroloading__image.webp";

export function ProfileNotFound({ identifier, isAuthenticated, onRetry }: { identifier: string; isAuthenticated: boolean; onRetry: () => void }) {
  const { t } = useLanguage();
  const destination = isAuthenticated ? "/profile" : "/catalog";
  const DestinationIcon = isAuthenticated ? CircleUserRound : Compass;

  return (
    <main className="profile-page profile-page--missing">
      <section aria-labelledby="profile-missing-title" className="profile-missing">
        <div aria-hidden="true" className="profile-missing__watermark">@?</div>
        <div aria-hidden="true" className="profile-missing__visual">
          <div className="profile-missing__radar">
            <span className="profile-missing__orbit" />
            <span className="profile-missing__dot profile-missing__dot--one" />
            <span className="profile-missing__dot profile-missing__dot--two" />
            <img src={profileMissingEmoji} alt="" />
          </div>
        </div>
        <div className="profile-missing__content">
          <h1 id="profile-missing-title">{t("profile.page.notFoundTitle")}</h1>
          <p>{t("profile.page.notFoundText")}</p>
          <div className="profile-missing__query">
            <SearchX size={19} aria-hidden="true" />
            <code>{identifier}</code>
            <small>{t("profile.page.notFoundQueryHint")}</small>
          </div>
          <div className="profile-missing__actions">
            <button className="profile-primary-button" onClick={() => navigateTo(destination)} type="button">
              <DestinationIcon size={17} aria-hidden="true" />
              {t(isAuthenticated ? "profile.page.myProfile" : "profile.page.goCatalog")}
            </button>
            <button className="profile-secondary-button" onClick={onRetry} type="button">
              <RefreshCw size={17} aria-hidden="true" />
              {t("profile.page.retry")}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
