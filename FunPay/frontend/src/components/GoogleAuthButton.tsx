import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { getGoogleAuthConfig } from "../api/authApi";
import { getReturnPathFromUrl, useAuth } from "../auth/AuthContext";
import { useLanguage } from "../i18n";

type GoogleAuthMode = "login" | "register";
type GoogleButtonState = "loading" | "ready" | "unavailable";

type GoogleAuthButtonProps = {
  mode: GoogleAuthMode;
  persist: boolean;
};

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (
        element: HTMLElement,
        options: {
          locale: string;
          shape: "rectangular";
          size: "large";
          text: "signin_with" | "signup_with";
          theme: "outline";
          type: "standard";
          width: number;
        }
      ) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

let googleScriptPromise: Promise<void> | null = null;
let googleScriptLocale: string | null = null;
let isGoogleInitialized = false;
let googleCredentialHandler: ((response: GoogleCredentialResponse) => void) | null = null;

export function GoogleAuthButton({ mode, persist }: GoogleAuthButtonProps) {
  const { continueWithGoogle } = useAuth();
  const { language, t } = useLanguage();
  const buttonHostRef = useRef<HTMLDivElement>(null);
  const [buttonState, setButtonState] = useState<GoogleButtonState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleCredential = useCallback(async (response: GoogleCredentialResponse) => {
    if (!response.credential) {
      setError(t("googleAuth.failed"));
      return;
    }

    setError(null);
    setIsAuthenticating(true);

    try {
      await continueWithGoogle(response.credential, {
        persist,
        returnTo: mode === "register" ? "/profile" : getReturnPathFromUrl()
      });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : t("googleAuth.failed"));
      setIsAuthenticating(false);
    }
  }, [continueWithGoogle, mode, persist, t]);

  useEffect(() => {
    let isActive = true;
    const buttonHost = buttonHostRef.current;

    if (!buttonHost) {
      return;
    }

    const credentialHandler = (response: GoogleCredentialResponse) => {
      void handleCredential(response);
    };
    googleCredentialHandler = credentialHandler;
    setButtonState("loading");
    setError(null);

    void getGoogleAuthConfig()
      .then(async (config) => {
        if (!config.enabled || !config.clientId) {
          if (isActive) {
            setButtonState("unavailable");
          }
          return;
        }

        await loadGoogleIdentityScript(language);

        if (!isActive || !window.google) {
          return;
        }

        if (!isGoogleInitialized) {
          window.google.accounts.id.initialize({
            client_id: config.clientId,
            callback: (response) => googleCredentialHandler?.(response)
          });
          isGoogleInitialized = true;
        }
        buttonHost.replaceChildren();
        window.google.accounts.id.renderButton(buttonHost, {
          locale: language,
          shape: "rectangular",
          size: "large",
          text: mode === "register" ? "signup_with" : "signin_with",
          theme: "outline",
          type: "standard",
          width: Math.min(400, Math.max(240, buttonHost.clientWidth || 320))
        });
        setButtonState("ready");
      })
      .catch(() => {
        if (isActive) {
          setButtonState("unavailable");
        }
      });

    return () => {
      isActive = false;
      if (googleCredentialHandler === credentialHandler) {
        googleCredentialHandler = null;
      }
      buttonHost.replaceChildren();
    };
  }, [handleCredential, language, mode]);

  return (
    <div className="google-auth">
      <div className="google-auth__divider">
        <span>{t("googleAuth.divider")}</span>
      </div>

      <div className="google-auth__button-wrap" aria-busy={buttonState === "loading" || isAuthenticating}>
        <div
          className={`google-auth__host${buttonState === "ready" && !isAuthenticating ? "" : " google-auth__host--hidden"}`}
          ref={buttonHostRef}
        />

        {buttonState === "loading" || isAuthenticating ? (
          <div className="google-auth__placeholder">
            <Loader2 className="animate-spin" size={18} aria-hidden="true" />
            {isAuthenticating ? t("googleAuth.signingIn") : t("googleAuth.loading")}
          </div>
        ) : buttonState === "unavailable" ? (
          <div className="google-auth__placeholder google-auth__placeholder--disabled">
            <img src="/assets/website/brand-google.svg" alt="" />
            {t("googleAuth.unavailable")}
          </div>
        ) : null}
      </div>

      {error ? <p className="google-auth__error">{error}</p> : null}
    </div>
  );
}

function loadGoogleIdentityScript(locale: string) {
  const existingScript = document.querySelector<HTMLScriptElement>("script[data-google-identity]");

  if (window.google && existingScript?.dataset.googleLocale === locale) {
    return Promise.resolve();
  }

  if (googleScriptPromise && googleScriptLocale === locale) {
    return googleScriptPromise;
  }

  existingScript?.remove();
  window.google = undefined;
  googleScriptLocale = locale;

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");

    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => {
      if (googleScriptLocale === locale) {
        googleScriptPromise = null;
        googleScriptLocale = null;
      }
      reject(new Error("Google Identity Services failed to load."));
    }, { once: true });

    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.dataset.googleLocale = locale;
    script.src = `https://accounts.google.com/gsi/client?hl=${encodeURIComponent(locale)}`;
    document.head.append(script);
  });

  return googleScriptPromise;
}
