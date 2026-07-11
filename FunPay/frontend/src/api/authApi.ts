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
  twoFactorEnabled: boolean;
  role: string;
  canManageTeam: boolean;
  gender: string;
  createdAt: string;
  avatarUrl?: string;
  avatarStyle?: string;
  selectedAvatarAsset?: string;
  selectedFrameAsset?: string;
  selectedWallpaperAsset?: string;
};

export type LoginPayload = {
  identity: string;
  password: string;
  language?: string;
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

export type GoogleAuthConfig = {
  enabled: boolean;
  clientId: string;
};

export type PasswordRecoveryVerified = {
  ticket: string;
  expiresAt: string;
};

export type SecurityChallenge = {
  token: string;
  expiresAt: string;
};

export type TwoFactorLoginChallenge = {
  requiresTwoFactor: true;
  challengeToken: string;
  expiresAt: string;
};

export type LoginResult = AuthSession | TwoFactorLoginChallenge;

export type EmailChangeCompleted = {
  email: string;
  twoFactorEnabled: boolean;
};

export type PasswordChangeResponse = {
  requiresCode: boolean;
  challengeToken: string;
  expiresAt: string | null;
  session: AuthSession | null;
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

export async function loginAccount(payload: LoginPayload): Promise<LoginResult> {
  return requestJson<LoginResult>(
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

export function isTwoFactorLoginChallenge(result: LoginResult): result is TwoFactorLoginChallenge {
  return "requiresTwoFactor" in result && result.requiresTwoFactor === true;
}

export async function completeTwoFactorLogin(
  token: string,
  code: string
): Promise<AuthSession> {
  return requestJson<AuthSession>(
    "/api/auth/login/two-factor",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, code })
    },
    "Код неверный или уже истёк."
  );
}

export async function requestTwoFactorToggle(
  accessToken: string,
  enabled: boolean,
  language: string
): Promise<SecurityChallenge> {
  return requestJson<SecurityChallenge>(
    "/api/auth/security/two-factor/request",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ enabled, language })
    },
    "Не удалось отправить код."
  );
}

export async function confirmTwoFactorToggle(
  accessToken: string,
  token: string,
  code: string
): Promise<{ enabled: boolean }> {
  return requestJson<{ enabled: boolean }>(
    "/api/auth/security/two-factor/confirm",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ token, code })
    },
    "Код неверный или уже истёк."
  );
}

export async function requestEmailChange(
  accessToken: string,
  newEmail: string,
  language: string
): Promise<SecurityChallenge> {
  return requestJson<SecurityChallenge>(
    "/api/auth/security/email-change/request",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ newEmail, language })
    },
    "Не удалось начать смену почты."
  );
}

export async function verifyCurrentEmailChange(
  accessToken: string,
  token: string,
  code: string,
  language: string
): Promise<SecurityChallenge> {
  return requestJson<SecurityChallenge>(
    "/api/auth/security/email-change/verify-current",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ token, code, language })
    },
    "Код неверный или уже истёк."
  );
}

export async function confirmEmailChange(
  accessToken: string,
  token: string,
  code: string
): Promise<EmailChangeCompleted> {
  return requestJson<EmailChangeCompleted>(
    "/api/auth/security/email-change/confirm",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ token, code })
    },
    "Код неверный или уже истёк."
  );
}

export async function changePassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
  language: string
): Promise<PasswordChangeResponse> {
  return requestJson<PasswordChangeResponse>(
    "/api/auth/security/password/change",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword, language })
    },
    "Не удалось изменить пароль."
  );
}

export async function confirmPasswordChange(
  accessToken: string,
  token: string,
  code: string
): Promise<AuthSession> {
  return requestJson<AuthSession>(
    "/api/auth/security/password/confirm",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ token, code })
    },
    "Код неверный или уже истёк."
  );
}

export async function changeManagedPassword(
  accessToken: string,
  identifier: string,
  newPassword: string,
  confirmPassword: string
): Promise<void> {
  await requestJson<unknown>(
    `/api/auth/security/manage/${encodeURIComponent(identifier)}/password`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword, confirmPassword })
    },
    "Не удалось изменить пароль аккаунта."
  );
}

export async function changeManagedTwoFactor(
  accessToken: string,
  identifier: string,
  enabled: boolean
): Promise<{ enabled: boolean }> {
  return requestJson<{ enabled: boolean }>(
    `/api/auth/security/manage/${encodeURIComponent(identifier)}/two-factor`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ enabled })
    },
    "Не удалось изменить двухфакторную защиту аккаунта."
  );
}

export async function changeManagedEmail(
  accessToken: string,
  identifier: string,
  newEmail: string
): Promise<EmailChangeCompleted> {
  return requestJson<EmailChangeCompleted>(
    `/api/auth/security/manage/${encodeURIComponent(identifier)}/email`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ newEmail })
    },
    "Не удалось изменить почту аккаунта."
  );
}

export async function getGoogleAuthConfig(): Promise<GoogleAuthConfig> {
  return requestJson<GoogleAuthConfig>(
    "/api/auth/google/config",
    {},
    "Не получилось проверить настройки входа через Google."
  );
}

export async function authenticateWithGoogle(credential: string): Promise<AuthSession> {
  return requestJson<AuthSession>(
    "/api/auth/google",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ credential })
    },
    "Не получилось войти через Google."
  );
}

export async function requestPasswordRecovery(
  identity: string,
  language: string
): Promise<void> {
  await requestJson<unknown>(
    "/api/auth/password/recovery/request",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ identity, language })
    },
    "Не получилось отправить код. Попробуйте позже."
  );
}

export async function verifyPasswordRecovery(
  identity: string,
  code: string
): Promise<PasswordRecoveryVerified> {
  return requestJson<PasswordRecoveryVerified>(
    "/api/auth/password/recovery/verify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ identity, code })
    },
    "Код неверный или уже истёк."
  );
}

export async function loginWithPasswordRecovery(ticket: string): Promise<AuthSession> {
  return requestJson<AuthSession>(
    "/api/auth/password/recovery/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ticket })
    },
    "Подтверждение истекло. Запросите новый код."
  );
}

export async function resetPasswordWithRecovery(
  ticket: string,
  password: string,
  confirmPassword: string
): Promise<AuthSession> {
  return requestJson<AuthSession>(
    "/api/auth/password/recovery/reset",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ticket, password, confirmPassword })
    },
    "Не получилось изменить пароль."
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
