const profileCosmeticsMarker = "/assets/website/profile-cosmetics/";
const namedAvatarBorderColors: Record<string, string> = {
  gold: "#F7C948",
  cyan: "#58D9FF",
  violet: "#B898FF"
};

const disabledAvatarBorderColorPattern = /^none:(#[0-9a-fA-F]{6})$/;
const rainbowAvatarBorderColorPattern = /^rainbow(?::(?:shift|spectrum))?:(#[0-9a-fA-F]{6})$/;

export function isAvatarBorderHidden(value = "") {
  return value === "none" || disabledAvatarBorderColorPattern.test(value);
}

export function isAvatarBorderRainbow(value = "") {
  return value === "rainbow" || value.startsWith("rainbow:");
}

export function isAvatarBorderRainbowSpectrum(value = "") {
  return value.startsWith("rainbow:spectrum:");
}

export function getCosmeticThumbnail(path = "", animated = false) {
  if (!path.startsWith(profileCosmeticsMarker)) {
    return path;
  }

  const folder = animated ? "animated-thumbnails" : "thumbnails";
  return path.replace(profileCosmeticsMarker, `${profileCosmeticsMarker}${folder}/`);
}

export function parseAvatarBorderColor(value = "") {
  const normalized = value.trim();
  const disabledMatch = normalized.match(disabledAvatarBorderColorPattern);
  const rainbowMatch = normalized.match(rainbowAvatarBorderColorPattern);

  if (disabledMatch) {
    return disabledMatch[1].toUpperCase();
  }
  if (rainbowMatch) {
    return rainbowMatch[1].toUpperCase();
  }
  const hexMatch = normalized.match(/^#?([\da-f]{6})$/i);

  if (hexMatch) {
    return `#${hexMatch[1].toUpperCase()}`;
  }

  const rgbMatch = normalized.match(/^rgb\s*:\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/i);

  if (!rgbMatch) {
    return null;
  }

  const channels = rgbMatch.slice(1).map(Number);
  return channels.every((channel) => channel >= 0 && channel <= 255)
    ? `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("").toUpperCase()}`
    : null;
}

export function getAvatarBorderColor(avatarStyle = "", frameStyle = "") {
  return parseAvatarBorderColor(avatarStyle)
    ?? namedAvatarBorderColors[frameStyle]
    ?? namedAvatarBorderColors[avatarStyle]
    ?? namedAvatarBorderColors.gold;
}
