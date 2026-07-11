import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AuthProvider,
  isProtectedRoute,
  rememberCurrentRouteForLogin,
  useAuth
} from "../auth/AuthContext";
import { Navbar } from "../components/Navbar";
import { PresenceTracker } from "../components/PresenceTracker";
import { RouteTransition } from "../components/RouteTransition";
import { MusicProvider } from "../features/music/MusicProvider";
import { LanguageProvider, useLanguage } from "../i18n";
import { Catalog } from "../pages/Catalog";
import { Chat } from "../pages/Chat";
import { Login } from "../pages/Login";
import { NotFound } from "../pages/NotFound";
import { Orders } from "../pages/Orders";
import { PasswordRecovery } from "../pages/PasswordRecovery";
import { Profile } from "../pages/Profile";
import { Register } from "../pages/Register";
import { RouteStub } from "../pages/RouteStub";
import { getCurrentRoute, navigateTo, navigationEventName } from "../shared/navigation";
import { runUiChangeTransition } from "../shared/uiTransitions";
import type { Theme } from "./theme";

type RouteStubConfig = {
  titleKey: string;
  textKey: string;
  video?: string;
};

const themeStorageKey = "funpay-theme";
const routeVideoPath = "/assets/website/backgrounds/routes";

const routeStubs: Record<string, RouteStubConfig> = {
  "/orders": {
    titleKey: "routes.orders.title",
    textKey: "routes.orders.text",
    video: `${routeVideoPath}/background_orders.webm`
  },
  "/support": {
    titleKey: "routes.support.title",
    textKey: "routes.support.text",
    video: `${routeVideoPath}/background_support.webm`
  },
  "/terms": {
    titleKey: "routes.terms.title",
    textKey: "routes.terms.text"
  },
  "/privacy": {
    titleKey: "routes.privacy.title",
    textKey: "routes.privacy.text"
  }
};

function getInitialTheme(): Theme {
  const savedTheme = localStorage.getItem(themeStorageKey);

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function replaceRootRoute() {
  if (window.location.pathname === "/" || window.location.pathname === "") {
    navigateTo("/register", true);
  }
}

function useRoute() {
  const [route, setRoute] = useState(getCurrentRoute);

  useEffect(() => {
    const updateRoute = () => setRoute(getCurrentRoute());

    window.addEventListener("popstate", updateRoute);
    window.addEventListener(navigationEventName, updateRoute);

    return () => {
      window.removeEventListener("popstate", updateRoute);
      window.removeEventListener(navigationEventName, updateRoute);
    };
  }, []);

  return route;
}

function useInternalLinkNavigation() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
      ) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");

      if (
        !(anchor instanceof HTMLAnchorElement)
        || anchor.hasAttribute("download")
        || anchor.dataset.noSpa === "true"
        || (anchor.target && anchor.target !== "_self")
      ) {
        return;
      }

      const destination = new URL(anchor.href, window.location.href);

      if (destination.origin !== window.location.origin) {
        return;
      }

      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const destinationPath = `${destination.pathname}${destination.search}${destination.hash}`;

      if (destinationPath === currentPath) {
        event.preventDefault();
        return;
      }

      if (
        destination.hash
        && destination.pathname === window.location.pathname
        && destination.search === window.location.search
      ) {
        return;
      }

      event.preventDefault();
      navigateTo(destinationPath);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);
}

function AppShell({ theme, onThemeChange }: { theme: Theme; onThemeChange: (theme: Theme) => void }) {
  const { t } = useLanguage();
  const route = useRoute();
  const { isAuthenticated, status } = useAuth();
  useInternalLinkNavigation();

  useEffect(() => {
    if (!isAuthenticated || (route !== "/login" && route !== "/register")) {
      return;
    }

    navigateTo("/catalog", true);
  }, [isAuthenticated, route]);

  useEffect(() => {
    if (status === "checking" || !isProtectedRoute(route) || isAuthenticated) {
      return;
    }

    if (window.location.pathname.startsWith("/login") || window.location.pathname.startsWith("/register")) {
      return;
    }

    rememberCurrentRouteForLogin();
    navigateTo(`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`, true);
  }, [isAuthenticated, route, status]);

  return (
    <>
      <PresenceTracker />
      <RouteTransition route={route}>
        {(displayedRoute) => {
          const routeStub = routeStubs[displayedRoute];
          const profileRouteMatch = displayedRoute.match(/^\/profile\/([^/]+)$/);
          let profileIdentifier: string | null = null;

          if (profileRouteMatch) {
            try {
              profileIdentifier = decodeURIComponent(profileRouteMatch[1]).trim();
            } catch {
              profileIdentifier = null;
            }
          }

          return (
            <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-200">
              <Navbar theme={theme} onThemeChange={onThemeChange} />
              {status === "checking" || (isProtectedRoute(displayedRoute) && !isAuthenticated) ? null : displayedRoute === "/register" ? (
                <Register />
              ) : displayedRoute === "/login" ? (
                <Login />
              ) : displayedRoute === "/recover" ? (
                <PasswordRecovery />
              ) : displayedRoute === "/catalog" ? (
                <Catalog />
              ) : displayedRoute === "/orders" ? (
                <Orders />
              ) : displayedRoute === "/chat" ? (
                <Chat />
              ) : displayedRoute === "/profile" ? (
                <Profile />
              ) : profileIdentifier ? (
                <Profile identifier={profileIdentifier} />
              ) : !routeStub ? (
                <NotFound />
              ) : (
                <RouteStub
                  path={displayedRoute}
                  title={t(routeStub.titleKey)}
                  text={t(routeStub.textKey)}
                  video={routeStub.video}
                />
              )}
            </div>
          );
        }}
      </RouteTransition>
    </>
  );
}

function MusicOwnerBoundary({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <MusicProvider
      canUseFavorites={Boolean(user)}
      key={user?.id ?? "guest"}
      ownerKey={user?.id ? `user-${user.id}` : "guest"}
    >
      {children}
    </MusicProvider>
  );
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const changeTheme = useCallback((nextTheme: Theme) => {
    runUiChangeTransition(() => setTheme(nextTheme));
  }, []);

  useEffect(() => {
    replaceRootRoute();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  return (
    <LanguageProvider>
      <AuthProvider>
        <MusicOwnerBoundary>
          <AppShell theme={theme} onThemeChange={changeTheme} />
        </MusicOwnerBoundary>
      </AuthProvider>
    </LanguageProvider>
  );
}
