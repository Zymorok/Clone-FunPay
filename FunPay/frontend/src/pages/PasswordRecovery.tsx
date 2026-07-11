import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck
} from "lucide-react";
import { requestPasswordRecovery, verifyPasswordRecovery } from "../api/authApi";
import { getReturnPathFromUrl, useAuth } from "../auth/AuthContext";
import { MarketPreview } from "../components/MarketPreview";
import { useLanguage } from "../i18n";

type RecoveryStage = "identity" | "code" | "choice" | "password";

const cornerCatPath = "/assets/website/animations/characters/cat_movement.svg";

export function PasswordRecovery() {
  const { continueWithRecovery, resetPasswordWithCode } = useAuth();
  const { language, t } = useLanguage();
  const [stage, setStage] = useState<RecoveryStage>("identity");
  const [identity, setIdentity] = useState("");
  const [code, setCode] = useState("");
  const [ticket, setTicket] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleIdentitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!identity.trim()) {
      setError(t("recovery.errors.identity"));
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await requestPasswordRecovery(identity, language);
      setStage("code");
    } catch (exception) {
      setError(getErrorMessage(exception, t("recovery.errors.request")));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!/^\d{6}$/.test(code)) {
      setError(t("recovery.errors.code"));
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await verifyPasswordRecovery(identity, code);
      setTicket(response.ticket);
      setStage("choice");
    } catch (exception) {
      setError(getErrorMessage(exception, t("recovery.errors.invalidCode")));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordlessLogin() {
    setError(null);
    setIsSubmitting(true);

    try {
      await continueWithRecovery(ticket, {
        persist: remember,
        returnTo: getReturnPathFromUrl()
      });
    } catch (exception) {
      setError(getErrorMessage(exception, t("recovery.errors.expired")));
      setIsSubmitting(false);
    }
  }

  async function handlePasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setError(t("recovery.errors.passwordLength"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("recovery.errors.passwordMismatch"));
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await resetPasswordWithCode(ticket, password, confirmPassword, { persist: remember });
    } catch (exception) {
      setError(getErrorMessage(exception, t("recovery.errors.reset")));
      setIsSubmitting(false);
    }
  }

  function returnToIdentity() {
    setStage("identity");
    setCode("");
    setTicket("");
    setError(null);
  }

  return (
    <>
      <main className="mx-auto grid max-w-[1260px] gap-5 px-4 py-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-6">
          <RecoveryHeading stage={stage} t={t} />

          {stage === "identity" ? (
            <form className="flex flex-1 flex-col gap-4" noValidate onSubmit={handleIdentitySubmit}>
              <label className="grid gap-1.5">
                <span className="text-[13px] font-extrabold text-[var(--text)]">
                  {t("recovery.identityLabel")}
                </span>
                <span className="auth-field-control relative block">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} aria-hidden="true" />
                  <input
                    autoComplete="username"
                    className="field"
                    maxLength={254}
                    onChange={(event) => {
                      setIdentity(event.target.value);
                      setError(null);
                    }}
                    placeholder={t("recovery.identityPlaceholder")}
                    value={identity}
                  />
                </span>
              </label>

              <PrivacyNotice t={t} />
              <RecoveryError error={error} />
              <SubmitButton isSubmitting={isSubmitting} label={t("recovery.sendCode")} />
              <BackToLogin t={t} />
            </form>
          ) : stage === "code" ? (
            <form className="flex flex-1 flex-col gap-4" noValidate onSubmit={handleCodeSubmit}>
              <label className="grid gap-1.5">
                <span className="text-[13px] font-extrabold text-[var(--text)]">{t("recovery.codeLabel")}</span>
                <span className="auth-field-control relative block">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} aria-hidden="true" />
                  <input
                    autoComplete="one-time-code"
                    autoFocus
                    className="field pr-4 text-center text-xl font-extrabold tracking-[0.45em]"
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(event) => {
                      setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                      setError(null);
                    }}
                    placeholder="000000"
                    value={code}
                  />
                </span>
              </label>

              <p className="text-sm leading-5 text-[var(--muted)]">{t("recovery.codePrivacy")}</p>
              <RecoveryError error={error} />
              <SubmitButton isSubmitting={isSubmitting} label={t("recovery.verifyCode")} />
              <button className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[var(--link)]" onClick={returnToIdentity} type="button">
                <ArrowLeft size={16} aria-hidden="true" />
                {t("recovery.changeIdentity")}
              </button>
            </form>
          ) : stage === "choice" ? (
            <div className="flex flex-1 flex-col gap-4">
              <div className="rounded-lg border border-[color-mix(in_srgb,var(--success)_40%,var(--border))] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 text-[var(--success)]" size={22} aria-hidden="true" />
                  <div>
                    <p className="font-extrabold text-[var(--text)]">{t("recovery.verifiedTitle")}</p>
                    <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{t("recovery.verifiedText")}</p>
                  </div>
                </div>
              </div>

              <RememberChoice remember={remember} setRemember={setRemember} t={t} />
              <RecoveryError error={error} />
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 text-sm font-extrabold text-[var(--accent-text)] disabled:opacity-65" disabled={isSubmitting} onClick={() => void handlePasswordlessLogin()} type="button">
                {isSubmitting ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <KeyRound size={18} aria-hidden="true" />}
                {t("recovery.loginWithCode")}
              </button>
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] px-5 text-sm font-extrabold text-[var(--text)]" disabled={isSubmitting} onClick={() => setStage("password")} type="button">
                <LockKeyhole size={18} aria-hidden="true" />
                {t("recovery.setNewPassword")}
              </button>
            </div>
          ) : (
            <form className="flex flex-1 flex-col gap-4" noValidate onSubmit={handlePasswordReset}>
              <PasswordInput label={t("recovery.newPassword")} placeholder={t("recovery.passwordPlaceholder")} value={password} onChange={setPassword} visible={isPasswordVisible} setVisible={setIsPasswordVisible} t={t} />
              <PasswordInput label={t("recovery.confirmPassword")} placeholder={t("recovery.confirmPlaceholder")} value={confirmPassword} onChange={setConfirmPassword} visible={isPasswordVisible} setVisible={setIsPasswordVisible} t={t} />
              <RememberChoice remember={remember} setRemember={setRemember} t={t} />
              <RecoveryError error={error} />
              <SubmitButton isSubmitting={isSubmitting} label={t("recovery.resetAndLogin")} />
              <button className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[var(--link)]" onClick={() => setStage("choice")} type="button">
                <ArrowLeft size={16} aria-hidden="true" />
                {t("recovery.backToChoice")}
              </button>
            </form>
          )}
        </section>

        <MarketPreview />
      </main>

      <div className="corner-cat" aria-hidden="true">
        <img src={cornerCatPath} alt="" draggable="false" />
      </div>
    </>
  );
}

function RecoveryHeading({ stage, t }: { stage: RecoveryStage; t: (key: string) => string }) {
  const isIdentity = stage === "identity";
  return (
    <div className="mb-5">
      <h1 className="text-[28px] font-extrabold leading-tight text-[var(--text)] sm:text-[30px]">
        {isIdentity ? t("recovery.title") : t(`recovery.stages.${stage}.title`)}
      </h1>
      <p className="mt-2 max-w-md text-sm leading-5 text-[var(--muted)]">
        {isIdentity ? t("recovery.subtitle") : t(`recovery.stages.${stage}.subtitle`)}
      </p>
    </div>
  );
}

function PrivacyNotice({ t }: { t: (key: string) => string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm leading-5 text-[var(--muted)]">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 shrink-0 text-[var(--accent-strong)]" size={20} aria-hidden="true" />
        <p>{t("recovery.privacy")}</p>
      </div>
    </div>
  );
}

function PasswordInput({ label, placeholder, value, onChange, visible, setVisible, t }: { label: string; placeholder: string; value: string; onChange: (value: string) => void; visible: boolean; setVisible: (value: boolean) => void; t: (key: string) => string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[13px] font-extrabold text-[var(--text)]">{label}</span>
      <span className="auth-field-control relative block">
        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} aria-hidden="true" />
        <input autoComplete="new-password" className="field pr-12" maxLength={100} minLength={8} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={visible ? "text" : "password"} value={value} />
        <button aria-label={visible ? t("recovery.hidePassword") : t("recovery.showPassword")} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--muted)]" onClick={() => setVisible(!visible)} type="button">
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </span>
    </label>
  );
}

function RememberChoice({ remember, setRemember, t }: { remember: boolean; setRemember: (value: boolean) => void; t: (key: string) => string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)]">
      <input checked={remember} className="size-4 accent-[var(--accent)]" onChange={(event) => setRemember(event.target.checked)} type="checkbox" />
      {t("recovery.remember")}
    </label>
  );
}

function SubmitButton({ isSubmitting, label }: { isSubmitting: boolean; label: string }) {
  return (
    <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 text-sm font-extrabold text-[var(--accent-text)] disabled:opacity-65" disabled={isSubmitting} type="submit">
      {isSubmitting ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : null}
      {label}
    </button>
  );
}

function RecoveryError({ error }: { error: string | null }) {
  return error ? (
    <p className="rounded-lg border border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
      {error}
    </p>
  ) : null;
}

function BackToLogin({ t }: { t: (key: string) => string }) {
  return (
    <a className="mt-auto inline-flex items-center justify-center gap-2 border-t border-[var(--border)] pt-4 text-sm font-semibold text-[var(--link)]" href="/login">
      <ArrowLeft size={16} aria-hidden="true" />
      {t("recovery.backToLogin")}
    </a>
  );
}

function getErrorMessage(exception: unknown, fallback: string) {
  return exception instanceof Error ? exception.message : fallback;
}
