import type { AuthUser } from "./authApi";
import { requestJson } from "./apiClient";
import type { PresenceStatus } from "./presenceApi";

export type ProfileData = AuthUser & {
  presenceStatus: PresenceStatus;
  lastLoginAt: string | null;
  description: string;
  gender: string;
  birthDate: string | null;
  countryCode: string;
  contacts: ProfileContact[];
  avatarUrl: string;
  avatarStyle: string;
  bannerStyle: "midnight" | "ember" | "aurora";
  frameStyle: "gold" | "cyan" | "violet" | "none";
  selectedAvatarAsset: string;
  selectedBannerAsset: string;
  selectedFrameAsset: string;
  selectedWallpaperAsset: string;
};

export type CosmeticAsset = {
  path: string;
  previewPath: string;
  animatedPreviewPath: string;
  name: string;
};

export type CosmeticCatalog = {
  avatars: CosmeticAsset[];
  banners: CosmeticAsset[];
  frames: CosmeticAsset[];
  wallpapers: CosmeticAsset[];
};

export type ProfileContact = {
  service: string;
  title: string;
  url: string;
  position: number;
};

export type ProfileContactPayload = Omit<ProfileContact, "position">;

export type ProfilePayload = Omit<
  Pick<
    ProfileData,
    | "nick"
    | "description"
    | "gender"
    | "birthDate"
    | "countryCode"
    | "avatarStyle"
    | "bannerStyle"
    | "frameStyle"
    | "selectedAvatarAsset"
    | "selectedBannerAsset"
    | "selectedFrameAsset"
    | "selectedWallpaperAsset"
  >,
  never
> & {
  contacts: ProfileContactPayload[];
};

export async function getMyProfile(accessToken: string): Promise<ProfileData> {
  return requestJson<ProfileData>(
    "/api/profile/me",
    { headers: { Authorization: `Bearer ${accessToken}` } },
    "Не удалось загрузить профиль."
  );
}

export async function getProfileByIdentifier(
  identifier: string,
  accessToken?: string | null,
  signal?: AbortSignal
): Promise<ProfileData> {
  return requestJson<ProfileData>(
    `/api/profile/${encodeURIComponent(identifier)}`,
    {
      signal,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
    },
    "Профиль не найден."
  );
}

export async function getProfileCosmetics(accessToken: string): Promise<CosmeticCatalog> {
  return requestJson<CosmeticCatalog>(
    "/api/profile/cosmetics",
    { headers: { Authorization: `Bearer ${accessToken}` } },
    "Не удалось загрузить предметы оформления."
  );
}

export async function updateMyProfile(accessToken: string, payload: ProfilePayload): Promise<ProfileData> {
  return requestJson<ProfileData>(
    "/api/profile/me",
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    },
    "Не удалось сохранить профиль."
  );
}

export async function updateProfileByIdentifier(
  accessToken: string,
  identifier: string,
  payload: ProfilePayload
): Promise<ProfileData> {
  return requestJson<ProfileData>(
    `/api/profile/${encodeURIComponent(identifier)}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    },
    "Не удалось сохранить профиль."
  );
}

export async function uploadMyAvatar(accessToken: string, file: File): Promise<ProfileData> {
  const data = new FormData();
  data.append("file", file);

  return requestJson<ProfileData>(
    "/api/profile/me/avatar",
    { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: data },
    "Не удалось загрузить аватарку."
  );
}

export async function uploadProfileAvatarByIdentifier(
  accessToken: string,
  identifier: string,
  file: File
): Promise<ProfileData> {
  const data = new FormData();
  data.append("file", file);

  return requestJson<ProfileData>(
    `/api/profile/${encodeURIComponent(identifier)}/avatar`,
    { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: data },
    "Не удалось загрузить аватарку."
  );
}
