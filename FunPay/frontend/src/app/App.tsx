import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AuthProvider,
  isProtectedRoute,
  rememberCurrentRouteForLogin,
  useAuth
} from "../auth/AuthContext";
import { Navbar } from "../components/Navbar";
import { PresenceTracker } from "../components/PresenceTracker";
import { RouteTransition } from "../components/RouteTransition";
import { LanguageProvider, useLanguage } from "../i18n";
import { Catalog } from "../pages/Catalog";
import { Login } from "../pages/Login";
import { NotFound } from "../pages/NotFound";
import { OfferPage } from "../pages/OfferPage";
import { Profile } from "../pages/Profile";
import { Register } from "../pages/Register";
import { RouteStub } from "../pages/RouteStub";
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
  "/chat": {
    titleKey: "routes.chat.title",
    textKey: "routes.chat.text",
    video: `${routeVideoPath}/background_chat.webm`
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

function ProfileRoute() {
  const params = useParams();
  const rawIdentifier = params.identifier;

  if (!rawIdentifier) {
    return <NotFound />;
  }

  try {
    const identifier = decodeURIComponent(rawIdentifier).trim();
    return identifier ? <Profile identifier={identifier} /> : <NotFound />;
  } catch {
    return <NotFound />;
  }
}

function AppShell({ theme, onThemeChange }: { theme: Theme; onThemeChange: (theme: Theme) => void }) {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, status } = useAuth();

  useEffect(() => {
    const currentPath = location.pathname;

    if (!isAuthenticated || (currentPath !== "/login" && currentPath !== "/register")) {
      return;
    }

    navigate("/catalog", { replace: true });
  }, [isAuthenticated, location.pathname, navigate]);

  useEffect(() => {
    const currentPath = location.pathname;

    if (status === "checking" || !isProtectedRoute(currentPath) || isAuthenticated) {
      return;
    }

    if (currentPath.startsWith("/login") || currentPath.startsWith("/register")) {
      return;
    }

    rememberCurrentRouteForLogin();
    navigate(`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`, { replace: true });
  }, [isAuthenticated, location.pathname, location.search, navigate, status]);

  return (
    <>
      <PresenceTracker />
      <RouteTransition route={location.pathname}>
        {() => (
          <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-200">
            <Navbar theme={theme} onThemeChange={onThemeChange} />
            {status === "checking" ? null : (
              <Routes>
                <Route path="/" element={<Register />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/offer/:id" element={<OfferPage />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:identifier" element={<ProfileRoute />} />
                <Route
                  path="/orders"
                  element={<RouteStub path="/orders" title={t(routeStubs["/orders"].titleKey)} text={t(routeStubs["/orders"].textKey)} video={routeStubs["/orders"].video} />}
                />
                <Route
                  path="/chat"
                  element={<RouteStub path="/chat" title={t(routeStubs["/chat"].titleKey)} text={t(routeStubs["/chat"].textKey)} video={routeStubs["/chat"].video} />}
                />
                <Route
                  path="/support"
                  element={<RouteStub path="/support" title={t(routeStubs["/support"].titleKey)} text={t(routeStubs["/support"].textKey)} video={routeStubs["/support"].video} />}
                />
                <Route
                  path="/terms"
                  element={<RouteStub path="/terms" title={t(routeStubs["/terms"].titleKey)} text={t(routeStubs["/terms"].textKey)} />}
                />
                <Route
                  path="/privacy"
                  element={<RouteStub path="/privacy" title={t(routeStubs["/privacy"].titleKey)} text={t(routeStubs["/privacy"].textKey)} />}
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            )}
          </div>
        )}
      </RouteTransition>
    </>
  );
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const changeTheme = useCallback((nextTheme: Theme) => {
    runUiChangeTransition(() => setTheme(nextTheme));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  return (
    <LanguageProvider>
      <AuthProvider>
        <AppShell theme={theme} onThemeChange={changeTheme} />
      </AuthProvider>
    </LanguageProvider>
  );
}
