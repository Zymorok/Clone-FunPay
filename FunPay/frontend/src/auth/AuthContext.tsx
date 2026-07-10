import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import {
  loginAccount,
  logoutSession,
  getCurrentUser,
  registerAccount,
  refreshSession,
  type AuthSession,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload
} from "../api/authApi";
import { getCurrentPath, navigateTo, sanitizeReturnPath } from "../shared/navigation";

type AuthStatus = "checking" | "authenticated" | "anonymous";
type AuthPersistence = "local" | "session";

type StoredSession = {
  persistence: AuthPersistence;
  session: AuthSession;
};

type AuthContextValue = {
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload, options?: LoginOptions) => Promise<void>;
  logout: (redirectTo?: string) => Promise<void>;
  register: (payload: RegisterPayload, options?: RegisterOptions) => Promise<void>;
  refreshAccessToken: () => Promise<AuthSession | null>;
  status: AuthStatus;
  updateCurrentUser: (user: AuthUser) => void;
  user: AuthUser | null;
};

type LoginOptions = {
  persist?: boolean;
  returnTo?: string | null;
};

type RegisterOptions = {
  persist?: boolean;
};

const authStorageKey = "funpay-auth-session";
const pendingRouteStorageKey = "funpay-auth-return-to";
const refreshBeforeExpireMs = 60_000;
const protectedRoutes = new Set(["/orders", "/chat", "/profile"]);
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialSession = useMemo(readStoredSession, []);
  const [session, setSession] = useState<AuthSession | null>(initialSession?.session ?? null);
  const [persistence, setPersistence] = useState<AuthPersistence>(initialSession?.persistence ?? "local");
  const [status, setStatus] = useState<AuthStatus>(initialSession ? "authenticated" : "anonymous");
  const refreshPromiseRef = useRef<Promise<AuthSession | null> | null>(null);

  const applySession = useCallback((nextSession: AuthSession, nextPersistence: AuthPersistence) => {
    setSession(nextSession);
    setPersistence(nextPersistence);
    setStatus("authenticated");
    saveStoredSession(nextSession, nextPersistence);
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
    setStatus("anonymous");
    clearStoredSession();
  }, []);

  const updateCurrentUser = useCallback((user: AuthUser) => {
    setSession((currentSession) => {
      if (!currentSession) {
        return currentSession;
      }

      const nextSession = { ...currentSession, user };
      saveStoredSession(nextSession, persistence);
      return nextSession;
    });
  }, [persistence]);

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }

    void getCurrentUser(session.accessToken)
      .then(updateCurrentUser)
      .catch(() => null);
  }, [session?.accessToken, updateCurrentUser]);

  const refreshAccessToken = useCallback(async () => {
    if (!session?.refreshToken) {
      clearSession();
      return null;
    }

    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = refreshSession(session.refreshToken)
        .then((nextSession) => {
          applySession(nextSession, persistence);
          return nextSession;
        })
        .catch(() => {
          clearSession();
          return null;
        })
        .finally(() => {
          refreshPromiseRef.current = null;
        });
    }

    return refreshPromiseRef.current;
  }, [applySession, clearSession, persistence, session?.refreshToken]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const expiresAt = new Date(session.accessTokenExpiresAt).getTime();
    const refreshDelay = Math.max(0, expiresAt - Date.now() - refreshBeforeExpireMs);
    const timeoutId = window.setTimeout(() => {
      void refreshAccessToken();
    }, refreshDelay);

    return () => window.clearTimeout(timeoutId);
  }, [refreshAccessToken, session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const expiresAt = new Date(session.accessTokenExpiresAt).getTime();

    if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
      void refreshAccessToken();
    }
  }, [refreshAccessToken, session]);

  const login = useCallback(
    async (payload: LoginPayload, options: LoginOptions = {}) => {
      const nextSession = await loginAccount(payload);
      const nextPersistence = options.persist === false ? "session" : "local";
      const returnTo = sanitizeReturnPath(options.returnTo ?? consumePendingReturnPath());

      applySession(nextSession, nextPersistence);
      navigateTo(returnTo, true);
    },
    [applySession]
  );

  const register = useCallback(
    async (payload: RegisterPayload, options: RegisterOptions = {}) => {
      const nextSession = await registerAccount(payload);
      const nextPersistence = options.persist === false ? "session" : "local";

      applySession(nextSession, nextPersistence);
      navigateTo("/profile", true);
    },
    [applySession]
  );

  const logout = useCallback(
    async (redirectTo = "/login") => {
      const refreshToken = session?.refreshToken ?? null;
      clearSession();

      if (refreshToken) {
        await logoutSession(refreshToken).catch(() => null);
      }

      navigateTo(redirectTo, true);
    },
    [clearSession, session?.refreshToken]
  );

  const value = useMemo<AuthContextValue>(() => {
    return {
      accessToken: session?.accessToken ?? null,
      isAuthenticated: Boolean(session),
      login,
      logout,
      register,
      refreshAccessToken,
      status,
      updateCurrentUser,
      user: session?.user ?? null
    };
  }, [login, logout, refreshAccessToken, register, session, status, updateCurrentUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

export function isProtectedRoute(route: string) {
  return protectedRoutes.has(route);
}

export function rememberCurrentRouteForLogin() {
  const currentPath = getCurrentPath();

  if (!currentPath.startsWith("/login") && !currentPath.startsWith("/register")) {
    sessionStorage.setItem(pendingRouteStorageKey, currentPath);
  }
}

export function getReturnPathFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return sanitizeReturnPath(params.get("returnTo") ?? consumePendingReturnPath());
}

function readStoredSession(): StoredSession | null {
  const localSession = readSessionFromStorage(localStorage, "local");

  if (localSession) {
    return localSession;
  }

  return readSessionFromStorage(sessionStorage, "session");
}

function readSessionFromStorage(storage: Storage, persistence: AuthPersistence): StoredSession | null {
  const rawSession = storage.getItem(authStorageKey);

  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession) as AuthSession;

    if (!session.accessToken || !session.refreshToken || !session.user) {
      storage.removeItem(authStorageKey);
      return null;
    }

    return { persistence, session };
  } catch {
    storage.removeItem(authStorageKey);
    return null;
  }
}

function saveStoredSession(session: AuthSession, persistence: AuthPersistence) {
  const targetStorage = persistence === "local" ? localStorage : sessionStorage;
  const otherStorage = persistence === "local" ? sessionStorage : localStorage;

  targetStorage.setItem(authStorageKey, JSON.stringify(session));
  otherStorage.removeItem(authStorageKey);
}

function clearStoredSession() {
  localStorage.removeItem(authStorageKey);
  sessionStorage.removeItem(authStorageKey);
}

function consumePendingReturnPath() {
  const returnPath = sessionStorage.getItem(pendingRouteStorageKey);
  sessionStorage.removeItem(pendingRouteStorageKey);
  return returnPath;
}
