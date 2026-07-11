import { useState } from "react";
import { useLanguage } from "../i18n";

export function EmailPrivacyToggle({ className = "", email }: { className?: string; email: string }) {
  const { t } = useLanguage();
  const [isRevealed, setIsRevealed] = useState(false);
  const stateClassName = isRevealed ? " email-privacy--revealed" : "";

  return (
    <button
      aria-label={t(isRevealed ? "emailPrivacy.hide" : "emailPrivacy.show")}
      aria-pressed={isRevealed}
      className={`email-privacy${stateClassName}${className ? ` ${className}` : ""}`}
      onClick={() => setIsRevealed((current) => !current)}
      type="button"
    >
      <span className="email-privacy__text">{email}</span>
      <span aria-hidden="true" className="email-privacy__veil" />
    </button>
  );
}
