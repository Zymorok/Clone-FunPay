import { useRef, useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { getReturnPathFromUrl, useAuth } from "../auth/AuthContext";
import { requestBrowserPasswordSave } from "../auth/browserCredentials";
import { MarketPreview } from "../components/MarketPreview";
import { useLanguage } from "../i18n";

const cornerCatPath = "/assets/website/animations/characters/cat_movement.svg";

export function Login() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invalidFields, setInvalidFields] = useState(() => new Set());
  const [shakingFields, setShakingFields] = useState(() => new Set());
  const formRef = useRef(null);

  function markInvalidFields(fields) {
    const nextFields = new Set(fields);
    setInvalidFields(nextFields);
    setShakingFields(nextFields);
  }

  function clearFieldError(field) {
    setInvalidFields((current) => withoutSetValue(current, field));
    setShakingFields((current) => withoutSetValue(current, field));
    setError(null);
  }

  function finishFieldShake(field) {
    setShakingFields((current) => withoutSetValue(current, field));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    const fieldsWithErrors = [];

    if (!identity.trim()) {
      fieldsWithErrors.push("identity");
    }

    if (!password) {
      fieldsWithErrors.push("password");
    }

    if (fieldsWithErrors.length > 0) {
      markInvalidFields(fieldsWithErrors);
      setError(t("login.errors.checkFields"));
      return;
    }

    setIsSubmitting(true);

    try {
      await login(
        {
          identity,
          password
        },
        {
          persist: remember,
          returnTo: getReturnPathFromUrl()
        }
      );

      requestBrowserPasswordSave(formRef.current, remember);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : t("login.errors.failed"));

      const status = getErrorStatus(exception);

      if (status === 400 || status === 401) {
        markInvalidFields(["identity", "password"]);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <main className="mx-auto grid max-w-[1260px] gap-5 px-4 py-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-6">
          <div className="mb-5">
            <h1 className="text-[28px] font-extrabold leading-tight tracking-normal text-[var(--text)] sm:text-[30px]">
              {t("login.title")}
            </h1>
            <p className="mt-2 max-w-md text-sm leading-5 text-[var(--muted)]">
              {t("login.subtitle")}
            </p>
          </div>

          <form className="flex flex-1 flex-col gap-4" noValidate onSubmit={handleSubmit} ref={formRef}>
            <label className="grid gap-1.5">
              <span className="text-[13px] font-extrabold text-[var(--text)]">
                {t("login.identityLabel")}
              </span>
              <span
                className={`auth-field-control relative block${shakingFields.has("identity") ? " auth-field-control--shake" : ""}`}
                onAnimationEnd={() => finishFieldShake("identity")}
              >
                <Mail
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                  size={18}
                  aria-hidden="true"
                />
                <input
                  autoComplete="username"
                  aria-invalid={invalidFields.has("identity")}
                  className={`field${invalidFields.has("identity") ? " field--submit-danger" : ""}`}
                  name="username"
                  onChange={(event) => {
                    setIdentity(event.target.value);
                    clearFieldError("identity");
                  }}
                  placeholder={t("login.identityPlaceholder")}
                  required
                  value={identity}
                />
              </span>
            </label>

            <label className="grid gap-1.5">
              <span className="text-[13px] font-extrabold text-[var(--text)]">
                {t("login.passwordLabel")}
              </span>
              <span
                className={`auth-field-control relative block${shakingFields.has("password") ? " auth-field-control--shake" : ""}`}
                onAnimationEnd={() => finishFieldShake("password")}
              >
                <Lock
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                  size={18}
                  aria-hidden="true"
                />
                <input
                  autoComplete="current-password"
                  aria-invalid={invalidFields.has("password")}
                  className={`field pr-12${invalidFields.has("password") ? " field--submit-danger" : ""}`}
                  name="password"
                  onChange={(event) => {
                    setPassword(event.target.value);
                    clearFieldError("password");
                  }}
                  placeholder={t("login.passwordPlaceholder")}
                  required
                  type={isPasswordVisible ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-label={isPasswordVisible ? t("login.hidePassword") : t("login.showPassword")}
                  className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface-strong)] hover:text-[var(--text)]"
                  onClick={() => setIsPasswordVisible((current) => !current)}
                  type="button"
                >
                  {isPasswordVisible ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </span>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <label className="inline-flex items-center gap-2 font-semibold text-[var(--muted)]">
                <input
                  checked={remember}
                  className="size-4 accent-[var(--accent)]"
                  onChange={(event) => setRemember(event.target.checked)}
                  type="checkbox"
                />
                {t("login.remember")}
              </label>
              <a className="font-semibold text-[var(--link)] transition hover:text-[var(--accent-strong)]" href="/support">
                {t("login.forgot")}
              </a>
            </div>

            {error ? (
              <p className="rounded-lg border border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
                {error}
              </p>
            ) : null}

            <button
              className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 text-sm font-extrabold text-[var(--accent-text)] shadow-sm transition hover:bg-[var(--accent-strong)] disabled:opacity-65"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : null}
              {t("login.submit")}
            </button>

            <div className="-mx-5 mt-auto border-t border-[var(--border)] pt-4 text-center sm:-mx-6">
              <a
                className="inline-flex items-center gap-3 text-sm font-semibold text-[var(--link)] transition hover:text-[var(--accent-strong)]"
                href="/register"
              >
                <span className="text-[var(--text)]">{t("login.noAccount")}</span>
                {t("login.register")}
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            </div>
          </form>
        </section>

        <MarketPreview />
      </main>

      <div className="corner-cat" aria-hidden="true">
        <img src={cornerCatPath} alt="" draggable="false" />
      </div>
    </>
  );
}

function withoutSetValue(current, value) {
  if (!current.has(value)) {
    return current;
  }

  const next = new Set(current);
  next.delete(value);
  return next;
}

function getErrorStatus(exception) {
  return exception && typeof exception === "object" && "status" in exception
    ? exception.status
    : null;
}
