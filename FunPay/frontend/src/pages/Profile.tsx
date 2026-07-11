import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { ApiError } from "../api/apiClient";
import {
  getMyProfile,
  getProfileByIdentifier,
  type ProfileData,
  type ProfilePayload
} from "../api/profileApi";
import { getPresenceByNormalizedNick, type PresenceStatus } from "../api/presenceApi";
import { useAuth } from "../auth/AuthContext";
import { useLanguage } from "../i18n";
import { navigateTo } from "../shared/navigation";
import { applyProfileDraft } from "./profile/profileModel";
import { ProfileEditor } from "./profile/ProfileEditor";
import { ProfileNotFound } from "./profile/ProfileNotFound";
import { ProfileView } from "./profile/ProfileView";

export function Profile({ identifier }: { identifier?: string }) {
  const { accessToken, isAuthenticated, updateCurrentUser, user } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [presenceStatus, setPresenceStatus] = useState<PresenceStatus>("offline");
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [previewDraft, setPreviewDraft] = useState<ProfilePayload | null>(null);
  const [savedMessage, setSavedMessage] = useState<{ id: number; text: string } | null>(null);

  async function loadProfile(signal?: AbortSignal) {
    if (!identifier && !accessToken) return;
    setIsLoading(true);
    setError("");
    setErrorStatus(null);
    try {
      const nextProfile = identifier
        ? await getProfileByIdentifier(identifier, accessToken, signal)
        : await getMyProfile(accessToken!);
      setProfile(nextProfile);
      setPresenceStatus(nextProfile.presenceStatus);
      setErrorStatus(null);
    } catch (exception) {
      if (exception instanceof DOMException && exception.name === "AbortError") return;
      setProfile(null);
      setErrorStatus(exception instanceof ApiError ? exception.status : null);
      setError(exception instanceof Error ? exception.message : t("profile.page.loadError"));
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    void loadProfile(controller.signal);
    return () => controller.abort();
  }, [accessToken, identifier]);
  useEffect(() => {
    if (!profile?.normalizedNick) return;

    const controller = new AbortController();
    const refreshPresence = async () => {
      try {
        const presence = await getPresenceByNormalizedNick(profile.normalizedNick, controller.signal);
        setPresenceStatus(presence.status);
      } catch (exception) {
        if (!(exception instanceof DOMException && exception.name === "AbortError")) {
          // NOTE: При временной потере сети сохраняем последний известный статус.
        }
      }
    };
    const intervalId = window.setInterval(() => void refreshPresence(), 15_000);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [profile?.normalizedNick]);
  useEffect(() => {
    if (!savedMessage) return;
    const timeout = window.setTimeout(() => setSavedMessage(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [savedMessage?.id]);
  function handleSaved(nextProfile: ProfileData) {
    setProfile(nextProfile);
    setPresenceStatus(nextProfile.presenceStatus);
    if (user?.id === nextProfile.id) updateCurrentUser({ ...user, ...nextProfile });
    if (identifier && identifier !== nextProfile.normalizedNick && identifier !== nextProfile.publicId) navigateTo(`/profile/${encodeURIComponent(nextProfile.normalizedNick)}`, true);
    setSavedMessage((current) => ({ id: (current?.id ?? 0) + 1, text: t("profile.page.saved") }));
  }
  function handlePreviewChange(nextDraft: ProfilePayload | null) { setPreviewDraft(nextDraft); if (nextDraft) setSavedMessage(null); }
  function openEditor() { setPreviewDraft(null); setIsEditing(true); }
  function closeEditor() { setPreviewDraft(null); setIsEditing(false); }
  if (isLoading) return <main className="profile-page"><div className="profile-loading"><LoaderCircle className="profile-spin" size={24} /></div></main>;
  if (!profile && errorStatus === 404 && identifier) return <ProfileNotFound identifier={identifier} isAuthenticated={isAuthenticated} onRetry={() => void loadProfile()} />;
  if (!profile) return <main className="profile-page"><section className="profile-error"><p>{error || t("profile.page.loadError")}</p><button className="profile-primary-button" onClick={() => void loadProfile()} type="button">{t("profile.page.retry")}</button></section></main>;

  const visibleProfile = previewDraft ? applyProfileDraft(profile, previewDraft) : profile;
  const canEditProfile = canEditTarget(user, profile);

  return (
    <ProfileView
      canEditProfile={canEditProfile}
      editor={isEditing && canEditProfile ? <ProfileEditor profile={profile} targetIdentifier={identifier} onClose={closeEditor} onPreviewChange={handlePreviewChange} onSaved={handleSaved} /> : null}
      isOwnProfile={user?.id === profile.id}
      onEdit={openEditor}
      presenceStatus={presenceStatus}
      profile={visibleProfile}
      savedMessage={savedMessage}
      showMusicFavorites={user?.id === profile.id}
    />
  );
}

function canEditTarget(user: ReturnType<typeof useAuth>["user"], profile: ProfileData) {
  if (!user) return false;
  if (user.id === profile.id) return true;
  if (user.role === "Admin") return profile.role === "User";
  if (user.role === "Owner") return profile.role === "User" || profile.role === "Admin";
  return false;
}
