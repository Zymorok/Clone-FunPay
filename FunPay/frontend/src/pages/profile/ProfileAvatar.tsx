import type { CSSProperties } from "react";
import { getApiAssetUrl } from "../../api/apiClient";
import type { ProfileData } from "../../api/profileApi";
import { isAvatarBorderHidden, isAvatarBorderRainbow, isAvatarBorderRainbowSpectrum, parseAvatarBorderColor } from "../../shared/cosmetics";

export function CountryFlag({ code }: { code: string }) {
  return code ? <span className={`fi fi-${code.toLowerCase()}`} aria-hidden="true" /> : null;
}

export function Avatar({ profile, size = "large", showAvatar = true, showFrame = true }: { profile: Pick<ProfileData, "nick" | "avatarUrl" | "avatarStyle" | "frameStyle" | "selectedAvatarAsset" | "selectedFrameAsset">; size?: "large" | "small"; showAvatar?: boolean; showFrame?: boolean }) {
  const avatarText = profile.nick.slice(0, 2).toUpperCase();
  const avatarUrl = profile.selectedAvatarAsset || getApiAssetUrl(profile.avatarUrl);
  const frameUrl = profile.selectedFrameAsset;
  const avatarBorderColor = parseAvatarBorderColor(profile.avatarStyle);
  const isBorderHidden = isAvatarBorderHidden(profile.avatarStyle);
  const isBorderRainbow = isAvatarBorderRainbow(profile.avatarStyle);
  const isBorderRainbowSpectrum = isAvatarBorderRainbowSpectrum(profile.avatarStyle);

  return (
    <span
      className={`profile-avatar profile-avatar--${size} profile-avatar--${profile.avatarStyle} profile-avatar--frame-${profile.frameStyle}${isBorderHidden ? " profile-avatar--border-hidden" : ""}${isBorderRainbow ? " profile-avatar--rainbow" : ""}${isBorderRainbowSpectrum ? " profile-avatar--rainbow-spectrum" : ""}`}
      aria-label={profile.nick}
      style={avatarBorderColor ? { borderColor: avatarBorderColor, color: avatarBorderColor } as CSSProperties : undefined}
    >
      {showAvatar && (avatarUrl ? <img src={avatarUrl} alt="" /> : avatarText)}
      {showFrame && frameUrl && <img className="profile-avatar__frame" src={frameUrl} alt="" />}
    </span>
  );
}

export function ProfileBannerVideo({ path }: { path: string }) {
  const webmPath = getBannerVideoVariant(path, "av1.webm");
  const mp4Path = getBannerVideoVariant(path, "h264.mp4") || path;
  const posterPath = getBannerPosterPath(path);

  return (
    <video
      autoPlay
      className="profile-cover__asset"
      disablePictureInPicture
      disableRemotePlayback
      loop
      muted
      onCanPlay={(event) => {
        // NOTE: Некоторые браузеры не запускают динамически добавленное видео только по атрибуту автоматического воспроизведения.
        void event.currentTarget.play().catch(() => null);
      }}
      playsInline
      poster={posterPath}
      preload="metadata"
    >
      {webmPath ? <source src={webmPath} type="video/webm" /> : null}
      <source src={mp4Path} type="video/mp4" />
    </video>
  );
}

function getBannerVideoVariant(path: string, variant: string) {
  return /__1920x480__(?:h264\.mp4|av1\.webm)$/i.test(path)
    ? path.replace(/__1920x480__(?:h264\.mp4|av1\.webm)$/i, `__1920x480__${variant}`)
    : "";
}

function getBannerPosterPath(path: string) {
  return /__1920x480__(?:h264\.mp4|av1\.webm)$/i.test(path)
    ? path.replace(/__1920x480__(?:h264\.mp4|av1\.webm)$/i, ".webp")
    : "";
}
