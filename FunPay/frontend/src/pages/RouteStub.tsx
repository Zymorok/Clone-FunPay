import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";
import { useLanguage } from "../i18n";

export type RouteStubInfo = {
  title: string;
  text: string;
  video?: string;
  actionLabel?: string;
  actionHref?: string;
};

type RouteStubProps = RouteStubInfo & {
  path: string;
};

export function RouteStub({ path, title, text, video, actionLabel, actionHref }: RouteStubProps) {
  const { t } = useLanguage();

  return (
    <main className="route-stub mt-4">
      {video ? (
        <video
          aria-hidden="true"
          autoPlay
          className="route-stub__video"
          loop
          muted
          playsInline
          src={video}
        />
      ) : null}

      <div className="route-stub__shade" />

      <section className="route-stub__content mx-auto flex min-h-[calc(100vh-96px)] max-w-[1260px] items-center px-4 py-16 sm:px-6">
        <div className="max-w-[620px]">
          <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-white/18 bg-black/20 px-3 py-2 text-sm font-bold text-white/82 backdrop-blur">
            <Clock3 size={16} aria-hidden="true" />
            {t("routes.common.inDevelopment")}
          </div>

          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
            {path}
          </p>
          <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-[520px] text-base leading-7 text-white/78">{text}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            {actionLabel && actionHref ? (
              <a
                className="inline-flex h-11 items-center gap-3 rounded-lg bg-[var(--accent)] px-5 text-sm font-extrabold text-[var(--accent-text)] transition hover:bg-[var(--accent-strong)]"
                href={actionHref}
              >
                {actionLabel}
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            ) : null}

            <a
              className="inline-flex h-11 items-center gap-3 rounded-lg border border-white/20 bg-white/10 px-5 text-sm font-extrabold text-white backdrop-blur transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
              href="/"
            >
              <ArrowLeft size={17} aria-hidden="true" />
              {t("routes.common.backHome")}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
