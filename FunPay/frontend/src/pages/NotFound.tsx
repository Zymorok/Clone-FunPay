import { ArrowLeft } from "lucide-react";
import { useLanguage } from "../i18n";

const notFoundEmoji = "/assets/website/stickers/sets/04/004__senkuro__sticker_005__senkuroknife__image.webp";

export function NotFound() {
  const { t } = useLanguage();

  return (
    <main className="not-found-page">
      <div aria-hidden="true" className="not-found-page__code">404</div>
      <section aria-labelledby="not-found-title" className="not-found-page__content">
        <img className="not-found-page__emoji" src={notFoundEmoji} alt="" />
        <h1 id="not-found-title">{t("routes.common.notFoundTitle")}</h1>
        <p>{t("routes.common.notFoundText")}</p>
        <a className="not-found-page__action" href="/">
          <ArrowLeft size={17} aria-hidden="true" />
          {t("routes.common.notFoundAction")}
        </a>
      </section>
    </main>
  );
}
