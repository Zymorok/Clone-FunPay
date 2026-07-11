import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { useLanguage } from "../../i18n";
import { GoogleAuthButton } from "../../components/GoogleAuthButton";
import { fieldClassName, getAvailabilityClass, getPasswordClass } from "./registerModel";
import { useRegisterForm } from "./useRegisterForm";

export function RegisterForm() {
  const { t } = useLanguage();
  const {
    confirmPasswordStatus,
    emailAvailability,
    error,
    finishFieldShake,
    form,
    formRef,
    handleSubmit,
    invalidFields,
    isPasswordVisible,
    isSubmitting,
    nickAvailability,
    passwordStatus,
    remember,
    setIsPasswordVisible,
    setRemember,
    shakingFields,
    updateField
  } = useRegisterForm();

  return (
    <section className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-6">
      <div className="mb-4">
        <h1 className="text-[28px] font-extrabold leading-tight tracking-normal text-[var(--text)] sm:text-[30px]">
          {t("register.title")}
        </h1>
        <p className="mt-2 max-w-md text-sm leading-5 text-[var(--muted)]">
          {t("register.subtitle")}
        </p>
      </div>

      <form className="flex flex-1 flex-col gap-3" noValidate onSubmit={handleSubmit} ref={formRef}>
        <label className="grid gap-1.5">
          <span className="text-[13px] font-extrabold text-[var(--text)]">{t("register.nickLabel")}</span>
          <span
            className={fieldClassName("auth-field-control relative block", shakingFields.has("nick") && "auth-field-control--shake")}
            onAnimationEnd={() => finishFieldShake("nick")}
          >
            <User
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              size={18}
              aria-hidden="true"
            />
            <input
              autoComplete="username"
              aria-invalid={invalidFields.has("nick")}
              className={fieldClassName("field", getAvailabilityClass(nickAvailability), invalidFields.has("nick") && "field--submit-danger")}
              maxLength={32}
              minLength={3}
              name="username"
              onChange={(event) => updateField("nick", event.target.value)}
              placeholder={t("register.nickPlaceholder")}
              required
              value={form.nick}
            />
          </span>
        </label>

        <label className="grid gap-1.5">
          <span className="text-[13px] font-extrabold text-[var(--text)]">{t("register.emailLabel")}</span>
          <span
            className={fieldClassName("auth-field-control relative block", shakingFields.has("email") && "auth-field-control--shake")}
            onAnimationEnd={() => finishFieldShake("email")}
          >
            <Mail
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              size={18}
              aria-hidden="true"
            />
            <input
              autoComplete="email"
              aria-invalid={invalidFields.has("email")}
              className={fieldClassName("field", getAvailabilityClass(emailAvailability), invalidFields.has("email") && "field--submit-danger")}
              maxLength={254}
              name="email"
              onChange={(event) => updateField("email", event.target.value)}
              placeholder={t("register.emailPlaceholder")}
              required
              type="email"
              value={form.email}
            />
          </span>
        </label>

        <label className="grid gap-1.5">
          <span className="text-[13px] font-extrabold text-[var(--text)]">{t("register.passwordLabel")}</span>
          <div
            className={fieldClassName("auth-field-control relative", shakingFields.has("password") && "auth-field-control--shake")}
            onAnimationEnd={() => finishFieldShake("password")}
          >
            <Lock
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              size={18}
              aria-hidden="true"
            />
            <input
              autoComplete="new-password"
              aria-invalid={invalidFields.has("password")}
              className={fieldClassName("field pr-12", getPasswordClass(passwordStatus), invalidFields.has("password") && "field--submit-danger")}
              maxLength={100}
              minLength={8}
              name="password"
              onChange={(event) => updateField("password", event.target.value)}
              placeholder={t("register.passwordPlaceholder")}
              required
              type={isPasswordVisible ? "text" : "password"}
              value={form.password}
            />
            <button
              aria-label={isPasswordVisible ? t("register.hidePassword") : t("register.showPassword")}
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
          </div>
        </label>

        <label className="grid gap-1.5">
          <span className="text-[13px] font-extrabold text-[var(--text)]">
            {t("register.confirmPasswordLabel")}
          </span>
          <span
            className={fieldClassName("auth-field-control relative block", shakingFields.has("confirmPassword") && "auth-field-control--shake")}
            onAnimationEnd={() => finishFieldShake("confirmPassword")}
          >
            <Lock
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              size={18}
              aria-hidden="true"
            />
            <input
              autoComplete="new-password"
              aria-invalid={invalidFields.has("confirmPassword")}
              className={fieldClassName("field pr-12", getPasswordClass(confirmPasswordStatus), invalidFields.has("confirmPassword") && "field--submit-danger")}
              maxLength={100}
              minLength={8}
              name="confirm-password"
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              placeholder={t("register.confirmPasswordPlaceholder")}
              required
              type={isPasswordVisible ? "text" : "password"}
              value={form.confirmPassword}
            />
            <button
              aria-label={
                isPasswordVisible
                  ? t("register.hideConfirmPassword")
                  : t("register.showConfirmPassword")
              }
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
            {t("register.remember")}
          </label>
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
          {t("register.submit")}
        </button>

        <GoogleAuthButton mode="register" persist={remember} />

        <p className="px-6 text-center text-[11px] leading-5 text-[var(--muted)]">
          {t("register.termsPrefix")}{" "}
          <a className="font-semibold text-[var(--link)] underline underline-offset-2" href="/terms">
            {t("register.termsLink")}
          </a>{" "}
          {t("register.privacyMiddle")}{" "}
          <a className="font-semibold text-[var(--link)] underline underline-offset-2" href="/privacy">
            {t("register.privacyLink")}
          </a>
          .
        </p>

        <div className="-mx-5 mt-auto border-t border-[var(--border)] pt-4 text-center sm:-mx-6">
          <a
            className="inline-flex items-center gap-3 text-sm font-semibold text-[var(--link)] transition hover:text-[var(--accent-strong)]"
            href="/login"
          >
            <span className="text-[var(--text)]">{t("register.hasAccount")}</span>
            {t("register.login")}
            <ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>
      </form>
    </section>
  );
}
