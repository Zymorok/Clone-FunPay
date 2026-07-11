import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, Loader2, Lock, Mail } from "lucide-react";
import { getReturnPathFromUrl, useAuth } from "../auth/AuthContext";
import { requestBrowserPasswordSave } from "../auth/browserCredentials";
import { MarketPreview } from "../components/MarketPreview";
import { GoogleAuthButton } from "../components/GoogleAuthButton";
import { useLanguage } from "../i18n";

const cornerCatPath = "/assets/website/animations/characters/cat_movement.svg";

export function Login() {
  const { language, t } = useLanguage();
  const { continueWithTwoFactor, login } = useAuth();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invalidFields, setInvalidFields] = useState(() => new Set());
  const [shakingFields, setShakingFields] = useState(() => new Set());
  const formRef = useRef(null);
  const isTwoFactorStep = Boolean(challengeToken);

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

  async function handleCredentialsSubmit(event) {
    event.preventDefault();
    setError(null);
    const fieldsWithErrors = [];

    if (!identity.trim()) fieldsWithErrors.push("identity");
    if (!password) fieldsWithErrors.push("password");

    if (fieldsWithErrors.length > 0) {
      markInvalidFields(fieldsWithErrors);
      setError(t("login.errors.checkFields"));
      return;
    }

    setIsSubmitting(true);

    try {
      const challenge = await login(
        { identity, password, language },
        { persist: remember, returnTo: getReturnPathFromUrl() }
      );

      if (challenge) {
        setChallengeToken(challenge.challengeToken);
        setCode("");
        setInvalidFields(new Set());
        return;
      }

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

  async function handleCodeSubmit(event) {
    event.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(code)) {
      markInvalidFields(["code"]);
      setError(t("login.twoFactor.codeError"));
      return;
    }

    setIsSubmitting(true);

    try {
      await continueWithTwoFactor(
        challengeToken,
        code,
        { persist: remember, returnTo: getReturnPathFromUrl() }
      );
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : t("login.twoFactor.codeError"));
      markInvalidFields(["code"]);
    } finally {
      setIsSubmitting(false);
    }
  }

  function returnToCredentials() {
    setChallengeToken("");
    setCode("");
    setError(null);
    setInvalidFields(new Set());
    setShakingFields(new Set());
  }

  return (
    <>
      <main className="mx-auto grid max-w-[1260px] gap-5 px-4 py-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-6">
          <div className="mb-5">
            <h1 className="text-[28px] font-extrabold leading-tight tracking-normal text-[var(--text)] sm:text-[30px]">
              {isTwoFactorStep ? t("login.twoFactor.title") : t("login.title")}
            </h1>
            <p className="mt-2 max-w-md text-sm leading-5 text-[var(--muted)]">
              {isTwoFactorStep ? t("login.twoFactor.subtitle") : t("login.subtitle")}
            </p>
          </div>

          <form
            className="flex flex-1 flex-col gap-4"
            noValidate
            onSubmit={isTwoFactorStep ? handleCodeSubmit : handleCredentialsSubmit}
            ref={formRef}
          >
            {isTwoFactorStep ? (
              <>
                <label className="grid gap-1.5">
                  <span className="text-[13px] font-extrabold text-[var(--text)]">{t("login.twoFactor.codeLabel")}</span>
                  <span
                    className={`auth-field-control relative block${shakingFields.has("code") ? " auth-field-control--shake" : ""}`}
                    onAnimationEnd={() => finishFieldShake("code")}
                  >
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} aria-hidden="true" />
                    <input
                      autoComplete="one-time-code"
                      aria-invalid={invalidFields.has("code")}
                      autoFocus
                      className={`field text-center tracking-[0.45em]${invalidFields.has("code") ? " field--submit-danger" : ""}`}
                      inputMode="numeric"
                      maxLength={6}
                      onChange={(event) => {
                        setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                        clearFieldError("code");
                      }}
                      placeholder="000000"
                      value={code}
                    />
                  </span>
                </label>
                <p className="text-sm leading-5 text-[var(--muted)]">{t("login.twoFactor.privacy")}</p>
              </>
            ) : (
              <CredentialsFields
                identity={identity}
                invalidFields={invalidFields}
                isPasswordVisible={isPasswordVisible}
                onIdentityChange={(value) => { setIdentity(value); clearFieldError("identity"); }}
                onPasswordChange={(value) => { setPassword(value); clearFieldError("password"); }}
                onShakeEnd={finishFieldShake}
                onTogglePassword={() => setIsPasswordVisible((current) => !current)}
                password={password}
                shakingFields={shakingFields}
                t={t}
              />
            )}

            {!isTwoFactorStep ? (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <label className="inline-flex items-center gap-2 font-semibold text-[var(--muted)]">
                  <input checked={remember} className="size-4 accent-[var(--accent)]" onChange={(event) => setRemember(event.target.checked)} type="checkbox" />
                  {t("login.remember")}
                </label>
                <a className="font-semibold text-[var(--link)] transition hover:text-[var(--accent-strong)]" href="/recover">{t("login.forgot")}</a>
              </div>
            ) : null}

            {error ? <p className="rounded-lg border border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-4 py-3 text-sm font-medium text-[var(--danger)]">{error}</p> : null}

            <button className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 text-sm font-extrabold text-[var(--accent-text)] shadow-sm transition hover:bg-[var(--accent-strong)] disabled:opacity-65" disabled={isSubmitting} type="submit">
              {isSubmitting ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : null}
              {isTwoFactorStep ? t("login.twoFactor.submit") : t("login.submit")}
            </button>

            {isTwoFactorStep ? (
              <button className="inline-flex h-10 items-center justify-center gap-2 text-sm font-semibold text-[var(--link)]" onClick={returnToCredentials} type="button">
                <ArrowLeft size={17} aria-hidden="true" />{t("login.twoFactor.back")}
              </button>
            ) : (
              <>
                <GoogleAuthButton mode="login" persist={remember} />
                <div className="-mx-5 mt-auto border-t border-[var(--border)] pt-4 text-center sm:-mx-6">
                  <a className="inline-flex items-center gap-3 text-sm font-semibold text-[var(--link)] transition hover:text-[var(--accent-strong)]" href="/register">
                    <span className="text-[var(--text)]">{t("login.noAccount")}</span>
                    {t("login.register")}<ArrowRight size={17} aria-hidden="true" />
                  </a>
                </div>
              </>
            )}
          </form>
        </section>

        <MarketPreview />
      </main>

      <div className="corner-cat" aria-hidden="true"><img src={cornerCatPath} alt="" draggable="false" /></div>
    </>
  );
}

function CredentialsFields({ identity, invalidFields, isPasswordVisible, onIdentityChange, onPasswordChange, onShakeEnd, onTogglePassword, password, shakingFields, t }) {
  return (
    <>
      <label className="grid gap-1.5">
        <span className="text-[13px] font-extrabold text-[var(--text)]">{t("login.identityLabel")}</span>
        <span className={`auth-field-control relative block${shakingFields.has("identity") ? " auth-field-control--shake" : ""}`} onAnimationEnd={() => onShakeEnd("identity")}>
          <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} aria-hidden="true" />
          <input autoComplete="username" aria-invalid={invalidFields.has("identity")} className={`field${invalidFields.has("identity") ? " field--submit-danger" : ""}`} name="username" onChange={(event) => onIdentityChange(event.target.value)} placeholder={t("login.identityPlaceholder")} required value={identity} />
        </span>
      </label>
      <label className="grid gap-1.5">
        <span className="text-[13px] font-extrabold text-[var(--text)]">{t("login.passwordLabel")}</span>
        <span className={`auth-field-control relative block${shakingFields.has("password") ? " auth-field-control--shake" : ""}`} onAnimationEnd={() => onShakeEnd("password")}>
          <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} aria-hidden="true" />
          <input autoComplete="current-password" aria-invalid={invalidFields.has("password")} className={`field pr-12${invalidFields.has("password") ? " field--submit-danger" : ""}`} name="password" onChange={(event) => onPasswordChange(event.target.value)} placeholder={t("login.passwordPlaceholder")} required type={isPasswordVisible ? "text" : "password"} value={password} />
          <button aria-label={isPasswordVisible ? t("login.hidePassword") : t("login.showPassword")} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface-strong)] hover:text-[var(--text)]" onClick={onTogglePassword} type="button">
            {isPasswordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </span>
      </label>
    </>
  );
}

function withoutSetValue(current, value) {
  if (!current.has(value)) return current;
  const next = new Set(current);
  next.delete(value);
  return next;
}

function getErrorStatus(exception) {
  return exception && typeof exception === "object" && "status" in exception ? exception.status : null;
}
