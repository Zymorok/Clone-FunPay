import type { ProfileData, ProfilePayload } from "../../api/profileApi";
import type { Language } from "../../i18n";

export const genders = ["", "male", "female", "other"] as const;

const membershipWords = {
  ru: {
    years: ["год", "года", "лет"],
    days: ["день", "дня", "дней"]
  },
  uk: {
    years: ["рік", "роки", "років"],
    days: ["день", "дні", "днів"]
  },
  en: {
    years: ["year", "years", "years"],
    days: ["day", "days", "days"]
  }
} as const;

function getCountWord(count: number, forms: readonly [string, string, string]) {
  const modulo100 = count % 100;
  const modulo10 = count % 10;

  if (modulo100 >= 11 && modulo100 <= 14) {
    return forms[2];
  }

  if (modulo10 === 1) {
    return forms[0];
  }

  return modulo10 >= 2 && modulo10 <= 4 ? forms[1] : forms[2];
}

export function formatMembershipDuration(createdAt: string, language: Language) {
  const start = new Date(createdAt);
  const today = new Date();

  if (Number.isNaN(start.getTime())) {
    return `0 ${membershipWords[language].days[2]}`;
  }

  let years = today.getFullYear() - start.getFullYear();
  let anniversary = new Date(start.getFullYear() + years, start.getMonth(), start.getDate());

  if (anniversary > today) {
    years -= 1;
    anniversary = new Date(start.getFullYear() + years, start.getMonth(), start.getDate());
  }

  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const anniversaryUtc = Date.UTC(anniversary.getFullYear(), anniversary.getMonth(), anniversary.getDate());
  const days = Math.max(0, Math.floor((todayUtc - anniversaryUtc) / 86_400_000));
  const words = membershipWords[language];
  const parts: string[] = [];

  if (years > 0) {
    parts.push(`${years} ${getCountWord(years, words.years)}`);
  }

  if (days > 0 || years === 0) {
    parts.push(`${days} ${getCountWord(days, words.days)}`);
  }

  return parts.join(" ");
}

export function profileToPayload(profile: ProfileData): ProfilePayload {
  return {
    nick: profile.nick,
    description: profile.description,
    gender: profile.gender,
    birthDate: profile.birthDate,
    countryCode: profile.countryCode,
    contacts: profile.contacts.map(({ service, title, url }) => ({ service, title, url })),
    avatarStyle: profile.avatarStyle,
    bannerStyle: profile.bannerStyle,
    frameStyle: profile.frameStyle,
    selectedAvatarAsset: profile.selectedAvatarAsset,
    selectedBannerAsset: profile.selectedBannerAsset,
    selectedFrameAsset: profile.selectedFrameAsset,
    selectedWallpaperAsset: profile.selectedWallpaperAsset
  };
}

export function applyProfileDraft(profile: ProfileData, draft: ProfilePayload): ProfileData {
  return {
    ...profile,
    ...draft,
    contacts: draft.contacts.map((contact, position) => ({ ...contact, position }))
  };
}

const videoAssetPattern = /\.(mp4|webm)(?:[?#].*)?$/i;

export function isVideoAsset(source: string) {
  return videoAssetPattern.test(source);
}
