import { useState, type ReactNode } from "react";
import { ArrowLeft, ChevronDown, KeyRound, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import {
  changeManagedEmail,
  changeManagedPassword,
  changeManagedTwoFactor,
  changePassword,
  confirmEmailChange,
  confirmPasswordChange,
  confirmTwoFactorToggle,
  requestEmailChange,
  requestTwoFactorToggle,
  verifyCurrentEmailChange,
  type AuthSession,
  type SecurityChallenge
} from "../../api/authApi";
import type { ProfileData } from "../../api/profileApi";
import { useAuth } from "../../auth/AuthContext";
import { EmailPrivacyToggle } from "../../components/EmailPrivacyToggle";
import { useLanguage } from "../../i18n";

type SecurityStage = "overview" | "email-input" | "email-current" | "email-new" | "two-factor" | "password" | "password-code";
type PendingTwoFactor = SecurityChallenge & { enabled: boolean };
type PendingEmail = SecurityChallenge & { newEmail: string; stage: "email-current" | "email-new" };

export function ProfileSecurityEditor({
  accessToken,
  isManaged = false,
  onFlowChange,
  onProfileChanged,
  profile,
  targetIdentifier
}: {
  accessToken: string;
  isManaged?: boolean;
  onFlowChange: (active: boolean) => void;
  onProfileChanged: (profile: ProfileData) => void;
  profile: ProfileData;
  targetIdentifier?: string;
}) {
  const { replaceCurrentSession } = useAuth();
  const { language, t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [stage, setStage] = useState<SecurityStage>("overview");
  const [newEmail, setNewEmail] = useState("");
  const [token, setToken] = useState("");
  const [code, setCode] = useState("");
  const [desiredTwoFactor, setDesiredTwoFactor] = useState(false);
  const [pendingTwoFactor, setPendingTwoFactor] = useState<PendingTwoFactor | null>(null);
  const [pendingEmail, setPendingEmail] = useState<PendingEmail | null>(null);
  const [pendingPassword, setPendingPassword] = useState<SecurityChallenge | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function moveTo(nextStage: SecurityStage) {
    setStage(nextStage);
    setIsExpanded(true);
    onFlowChange(nextStage !== "overview");
    setCode("");
    setError("");
  }

  function returnToOverview() {
    setToken("");
    moveTo("overview");
  }

  function updateProfileSecurity(values: Partial<Pick<ProfileData, "email" | "twoFactorEnabled">>) {
    onProfileChanged({ ...profile, ...values });
  }

  function openEmailFlow() {
    if (!isManaged && isActiveChallenge(pendingEmail)) {
      setNewEmail(pendingEmail.newEmail);
      setToken(pendingEmail.token);
      moveTo(pendingEmail.stage);
      return;
    }

    setPendingEmail(null);
    setNewEmail("");
    moveTo("email-input");
  }

  async function startEmailChange() {
    if (!newEmail.trim()) {
      setError(t("profile.security.errors.email"));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      if (isManaged) {
        const result = await changeManagedEmail(accessToken, requireTarget(targetIdentifier), newEmail);
        updateProfileSecurity({ email: result.email, twoFactorEnabled: result.twoFactorEnabled });
        returnToOverview();
        return;
      }

      const challenge = await requestEmailChange(accessToken, newEmail, language);
      const pending = { ...challenge, newEmail: newEmail.trim(), stage: "email-current" as const };
      setPendingEmail(pending);
      setToken(challenge.token);
      moveTo("email-current");
    } catch (exception) {
      setError(getErrorMessage(exception, t("profile.security.errors.emailChange")));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function startTwoFactorToggle(forceNewCode = false) {
    if (isSubmitting) return;
    const enabled = !profile.twoFactorEnabled;

    if (!isManaged && !forceNewCode && isActiveChallenge(pendingTwoFactor) && pendingTwoFactor.enabled === enabled) {
      setDesiredTwoFactor(enabled);
      setToken(pendingTwoFactor.token);
      moveTo("two-factor");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      if (isManaged) {
        const result = await changeManagedTwoFactor(accessToken, requireTarget(targetIdentifier), enabled);
        updateProfileSecurity({ twoFactorEnabled: result.enabled });
        return;
      }

      const challenge = await requestTwoFactorToggle(accessToken, enabled, language);
      const pending = { ...challenge, enabled };
      setDesiredTwoFactor(enabled);
      setPendingTwoFactor(pending);
      setToken(challenge.token);
      moveTo("two-factor");
    } catch (exception) {
      setError(getErrorMessage(exception, t("profile.security.errors.send")));
    } finally {
      setIsSubmitting(false);
    }
  }

  function openPasswordFlow() {
    if (!isManaged && isActiveChallenge(pendingPassword)) {
      setToken(pendingPassword.token);
      moveTo("password-code");
      return;
    }

    setPendingPassword(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    moveTo("password");
  }

  async function submitPasswordChange(forceNewCode = false) {
    if (newPassword.length < 8) {
      setError(t("profile.security.errors.passwordLength"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("profile.security.errors.passwordMismatch"));
      return;
    }

    if (!isManaged && !currentPassword) {
      setError(t("profile.security.errors.currentPassword"));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      if (isManaged) {
        await changeManagedPassword(
          accessToken,
          requireTarget(targetIdentifier),
          newPassword,
          confirmPassword
        );
        onProfileChanged(profile);
        clearPasswordState();
        returnToOverview();
        return;
      }

      if (!forceNewCode && isActiveChallenge(pendingPassword)) {
        setToken(pendingPassword.token);
        moveTo("password-code");
        return;
      }

      const result = await changePassword(
        accessToken,
        currentPassword,
        newPassword,
        confirmPassword,
        language
      );

      if (result.requiresCode) {
        const pending = {
          token: result.challengeToken,
          expiresAt: result.expiresAt ?? new Date(Date.now() + 15 * 60_000).toISOString()
        };
        setPendingPassword(pending);
        setToken(pending.token);
        moveTo("password-code");
        return;
      }

      if (result.session) {
        finishOwnPasswordChange(result.session);
      }
    } catch (exception) {
      setError(getErrorMessage(exception, t("profile.security.errors.passwordChange")));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitCode() {
    if (!/^\d{6}$/.test(code)) {
      setError(t("profile.security.errors.code"));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      if (stage === "two-factor") {
        const result = await confirmTwoFactorToggle(accessToken, token, code);
        setPendingTwoFactor(null);
        updateProfileSecurity({ twoFactorEnabled: result.enabled });
        returnToOverview();
        return;
      }

      if (stage === "email-current") {
        const challenge = await verifyCurrentEmailChange(accessToken, token, code, language);
        const pending = { ...challenge, newEmail, stage: "email-new" as const };
        setPendingEmail(pending);
        setToken(challenge.token);
        moveTo("email-new");
        return;
      }

      if (stage === "email-new") {
        const result = await confirmEmailChange(accessToken, token, code);
        setPendingEmail(null);
        updateProfileSecurity({ email: result.email, twoFactorEnabled: result.twoFactorEnabled });
        returnToOverview();
        return;
      }

      if (stage === "password-code") {
        const session = await confirmPasswordChange(accessToken, token, code);
        finishOwnPasswordChange(session);
      }
    } catch (exception) {
      setError(getErrorMessage(exception, t("profile.security.errors.code")));
    } finally {
      setIsSubmitting(false);
    }
  }

  function finishOwnPasswordChange(session: AuthSession) {
    replaceCurrentSession(session);
    setPendingPassword(null);
    onProfileChanged({ ...profile, ...session.user });
    clearPasswordState();
    returnToOverview();
  }

  function clearPasswordState() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  if (stage === "email-input") {
    return (
      <SecurityStep
        description={t(isManaged ? "profile.security.managedEmailText" : "profile.security.emailInputText")}
        error={error}
        icon={<Mail size={22} aria-hidden="true" />}
        onBack={returnToOverview}
        title={t("profile.security.emailInputTitle")}
      >
        <div className="profile-security__form">
          <label className="profile-field">
            <span>{t("profile.security.newEmail")}</span>
            <input autoComplete="email" onChange={(event) => { setNewEmail(event.target.value); setError(""); }} placeholder={t("profile.security.newEmailPlaceholder")} type="email" value={newEmail} />
          </label>
          <SecuritySubmitButton busy={isSubmitting} label={t(isManaged ? "profile.security.applyDirectly" : "profile.security.sendCurrentCode")} onClick={() => void startEmailChange()} />
        </div>
      </SecurityStep>
    );
  }

  if (stage === "password") {
    return (
      <SecurityStep
        description={t(isManaged ? "profile.security.managedPasswordText" : "profile.security.passwordText")}
        error={error}
        icon={<LockKeyhole size={22} aria-hidden="true" />}
        onBack={returnToOverview}
        title={t("profile.security.passwordTitle")}
      >
        <PasswordFields
          confirmPassword={confirmPassword}
          currentPassword={currentPassword}
          isManaged={isManaged}
          newPassword={newPassword}
          onConfirmPassword={setConfirmPassword}
          onCurrentPassword={setCurrentPassword}
          onNewPassword={setNewPassword}
          t={t}
        />
        <SecuritySubmitButton busy={isSubmitting} label={t("profile.security.changePassword")} onClick={() => void submitPasswordChange()} />
      </SecurityStep>
    );
  }

  if (stage !== "overview") {
    const isTwoFactor = stage === "two-factor";
    const isPasswordCode = stage === "password-code";
    const isCurrentEmail = stage === "email-current";
    return (
      <SecurityStep
        description={isTwoFactor
          ? t(desiredTwoFactor ? "profile.security.enableCodeText" : "profile.security.disableCodeText")
          : isPasswordCode
            ? t("profile.security.passwordCodeText")
            : t(isCurrentEmail ? "profile.security.currentCodeText" : "profile.security.newCodeText")}
        error={error}
        icon={<KeyRound size={22} aria-hidden="true" />}
        onBack={returnToOverview}
        title={t(isTwoFactor
          ? "profile.security.twoFactorCodeTitle"
          : isPasswordCode
            ? "profile.security.passwordCodeTitle"
            : isCurrentEmail
              ? "profile.security.currentCodeTitle"
              : "profile.security.newCodeTitle")}
      >
        <div className="profile-security__form">
          <label className="profile-field">
            <span>{t("profile.security.code")}</span>
            <input autoComplete="one-time-code" autoFocus className="profile-security__code" inputMode="numeric" maxLength={6} onChange={(event) => { setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} placeholder="000000" value={code} />
          </label>
          <p className="profile-security__hint">{t("profile.security.codeLifetime")}</p>
          <SecuritySubmitButton busy={isSubmitting} label={isCurrentEmail ? t("profile.security.continue") : t("profile.security.confirm")} onClick={() => void submitCode()} />
          {isTwoFactor || isPasswordCode ? (
            <button className="profile-secondary-button profile-security__submit" disabled={isSubmitting} onClick={() => void (isTwoFactor ? startTwoFactorToggle(true) : submitPasswordChange(true))} type="button">
              {t("profile.security.resendCode")}
            </button>
          ) : null}
        </div>
      </SecurityStep>
    );
  }

  const hasPendingTwoFactor = isActiveChallenge(pendingTwoFactor)
    && pendingTwoFactor.enabled === !profile.twoFactorEnabled;
  const hasPendingEmail = isActiveChallenge(pendingEmail);
  const hasPendingPassword = isActiveChallenge(pendingPassword);

  return (
    <section className={`profile-security${isExpanded ? " profile-security--expanded" : ""}`}>
      <button aria-expanded={isExpanded} className="profile-security__toggle" onClick={() => setIsExpanded((current) => !current)} type="button">
        <span className="profile-section-title"><ShieldCheck size={17} aria-hidden="true" /> {t("profile.security.title")}</span>
        <ChevronDown aria-hidden="true" size={18} />
      </button>
      {isExpanded ? (
        <div className="profile-security__content">
          {isManaged ? <p className="profile-security__managed-note">{t("profile.security.managedMode")}</p> : null}
          <div className="profile-security__row">
            <div>
              <strong>{t("profile.security.email")}</strong>
              <EmailPrivacyToggle email={profile.email} />
            </div>
            <button className="profile-secondary-button" onClick={openEmailFlow} type="button">{t(hasPendingEmail ? "profile.security.continuePending" : "profile.security.changeEmail")}</button>
          </div>
          <div className="profile-security__row">
            <div><strong>{t("profile.security.password")}</strong><span>{t("profile.security.passwordHint")}</span></div>
            <button className="profile-secondary-button" onClick={openPasswordFlow} type="button">{t(hasPendingPassword ? "profile.security.continuePending" : "profile.security.changePassword")}</button>
          </div>
          <div className="profile-security__row">
            <div><strong>{t("profile.security.twoFactor")}</strong><span>{t(profile.twoFactorEnabled ? "profile.security.enabled" : "profile.security.disabled")}</span></div>
            <div className="profile-security__actions">
              {hasPendingTwoFactor ? <button className="profile-security__resume" onClick={() => void startTwoFactorToggle()} type="button">{t("profile.security.enterSentCode")}</button> : null}
              <button aria-checked={profile.twoFactorEnabled} aria-label={t("profile.security.twoFactor")} className={`profile-security__switch${profile.twoFactorEnabled ? " profile-security__switch--active" : ""}`} disabled={isSubmitting} onClick={() => void startTwoFactorToggle()} role="switch" type="button"><span aria-hidden="true" /></button>
            </div>
          </div>
          {error ? <p className="profile-editor__error">{error}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

function SecurityStep({ children, description, error, icon, onBack, title }: { children: ReactNode; description: string; error: string; icon: ReactNode; onBack: () => void; title: string }) {
  const { t } = useLanguage();
  return (
    <section className="profile-security-step">
      <div className="profile-security-step__icon">{icon}</div>
      <div className="profile-security-step__copy"><h2>{title}</h2><p>{description}</p></div>
      {children}
      {error ? <p className="profile-editor__error">{error}</p> : null}
      <button className="profile-security-step__back" onClick={onBack} type="button"><ArrowLeft size={17} aria-hidden="true" />{t("profile.security.back")}</button>
    </section>
  );
}

function PasswordFields({ confirmPassword, currentPassword, isManaged, newPassword, onConfirmPassword, onCurrentPassword, onNewPassword, t }: { confirmPassword: string; currentPassword: string; isManaged: boolean; newPassword: string; onConfirmPassword: (value: string) => void; onCurrentPassword: (value: string) => void; onNewPassword: (value: string) => void; t: (key: string) => string }) {
  return (
    <div className="profile-security__form">
      {!isManaged ? <PasswordField autoComplete="current-password" label={t("profile.security.currentPassword")} onChange={onCurrentPassword} value={currentPassword} /> : null}
      <PasswordField autoComplete="new-password" label={t("profile.security.newPassword")} onChange={onNewPassword} value={newPassword} />
      <PasswordField autoComplete="new-password" label={t("profile.security.confirmNewPassword")} onChange={onConfirmPassword} value={confirmPassword} />
    </div>
  );
}

function PasswordField({ autoComplete, label, onChange, value }: { autoComplete: string; label: string; onChange: (value: string) => void; value: string }) {
  return <label className="profile-field"><span>{label}</span><input autoComplete={autoComplete} maxLength={128} minLength={8} onChange={(event) => onChange(event.target.value)} type="password" value={value} /></label>;
}

function SecuritySubmitButton({ busy, label, onClick }: { busy: boolean; label: string; onClick: () => void }) {
  return <button className="profile-primary-button profile-security__submit" disabled={busy} onClick={onClick} type="button">{busy ? <LoaderCircle className="profile-spin" size={17} /> : null}{label}</button>;
}

function isActiveChallenge(challenge: SecurityChallenge | null): challenge is SecurityChallenge {
  return Boolean(challenge && Date.parse(challenge.expiresAt) > Date.now());
}

function requireTarget(identifier: string | undefined) {
  if (!identifier) throw new Error("Не удалось определить редактируемый профиль.");
  return identifier;
}

function getErrorMessage(exception: unknown, fallback: string) {
  return exception instanceof Error ? exception.message : fallback;
}
