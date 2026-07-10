import { requestJson } from "./apiClient";

export type RegisterPayload = {
  nick: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type AuthUser = {
  id: number;
  publicId: string;
  nick: string;
  normalizedNick: string;
  email: string;
  role: string;
  canManageTeam: boolean;
  gender: string;
  createdAt: string;
  avatarUrl?: string;
  avatarStyle?: string;
  selectedAvatarAsset?: string;
  selectedFrameAsset?: string;
};

export type LoginPayload = {
  identity: string;
  password: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  user: AuthUser;
};

export type AvailabilityField = "nick" | "email";

export type AvailabilityResponse = {
  available: boolean;
  message?: string;
};

export async function checkAuthFieldAvailability(
  field: AvailabilityField,
  value: string,
  signal?: AbortSignal
): Promise<AvailabilityResponse> {
  const params = new URLSearchParams({ value });
  return requestJson<AvailabilityResponse>(`/api/auth/availability/${field}?${params}`, { signal }, "Не получилось проверить поле.");
}

export async function registerAccount(payload: RegisterPayload): Promise<AuthSession> {
  return requestJson<AuthSession>(
    "/api/auth/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    },
    "Не получилось создать аккаунт."
  );
}

export async function loginAccount(payload: LoginPayload): Promise<AuthSession> {
  return requestJson<AuthSession>(
    "/api/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    },
    "Не получилось войти."
  );
}

export async function refreshSession(refreshToken: string): Promise<AuthSession> {
  return requestJson<AuthSession>(
    "/api/auth/refresh",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refreshToken })
    },
    "Сессия истекла. Войдите снова."
  );
}

export async function getCurrentUser(accessToken: string): Promise<AuthUser> {
  return requestJson<AuthUser>(
    "/api/auth/me",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    "Сессия истекла. Войдите снова."
  );
}

export async function logoutSession(refreshToken: string | null): Promise<void> {
  await requestJson<unknown>(
    "/api/auth/logout",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refreshToken })
    },
    "Не получилось выйти."
  );
}
