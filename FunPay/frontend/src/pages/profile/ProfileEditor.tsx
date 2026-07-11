import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Camera, Eye, LoaderCircle, Pencil, Save, Sparkles, X } from "lucide-react";
import {
  getProfileCosmetics,
  type CosmeticCatalog,
  type ProfileData,
  type ProfilePayload,
  updateMyProfile,
  updateProfileByIdentifier,
  uploadMyAvatar,
  uploadProfileAvatarByIdentifier
} from "../../api/profileApi";
import { useAuth } from "../../auth/AuthContext";
import { useAnimatedDialog } from "../../components/useAnimatedDialog";
import { useLanguage } from "../../i18n";
import { AvatarBorderEditor, CosmeticPicker } from "./ProfileCosmetics";
import { Avatar } from "./ProfileAvatar";
import { ProfileSecurityEditor } from "./ProfileSecurityEditor";
import { ContactEditor, CountryPicker } from "./ProfileFields";
import { genders, profileToPayload } from "./profileModel";

const hoverOnlyAnimationsStorageKey = "funpay-cosmetics-hover-only";

function readHoverOnlyAnimations() {
  try {
    return window.localStorage.getItem(hoverOnlyAnimationsStorageKey) === "true";
  } catch {
    return false;
  }
}

function storeHoverOnlyAnimations(enabled: boolean) {
  try {
    window.localStorage.setItem(hoverOnlyAnimationsStorageKey, String(enabled));
  } catch {
    // Настройка останется активной до перезагрузки, если хранилище браузера недоступно.
  }
}

export function ProfileEditor({ profile, targetIdentifier, onClose, onPreviewChange, onSaved }: { profile: ProfileData; targetIdentifier?: string; onClose: () => void; onPreviewChange: (draft: ProfilePayload | null) => void; onSaved: (profile: ProfileData) => void }) {
  const { accessToken, user } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState<ProfilePayload>(() => profileToPayload(profile));
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSecurityFlowActive, setIsSecurityFlowActive] = useState(false);
  const { isClosing, requestClose } = useAnimatedDialog(onClose);
  const [cosmetics, setCosmetics] = useState<CosmeticCatalog>({ avatars: [], banners: [], frames: [], wallpapers: [] });
  const [hoverOnlyAnimations, setHoverOnlyAnimations] = useState(readHoverOnlyAnimations);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewButtonRef = useRef<HTMLButtonElement | null>(null);
  const previewCloseButtonRef = useRef<HTMLButtonElement | null>(null);
  const isOwnProfile = user?.id === profile.id;
  const canManageSecurity = Boolean(!isOwnProfile && user && (
    (user.role === "Admin" && profile.role === "User")
    || (user.role === "Owner" && (profile.role === "User" || profile.role === "Admin"))
  ));

  const updateField = <Key extends keyof ProfilePayload>(key: Key, value: ProfilePayload[Key]) => setForm((current) => ({ ...current, [key]: value }));
  const updateHoverOnlyAnimations = (enabled: boolean) => {
    setHoverOnlyAnimations(enabled);
    storeHoverOnlyAnimations(enabled);
  };

  useEffect(() => {
    if (isPreviewing) {
      return;
    }

    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;

    root.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [isPreviewing]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();

      if (isPreviewing) {
        setIsPreviewing(false);
        onPreviewChange(null);
        requestAnimationFrame(() => previewButtonRef.current?.focus());
        return;
      }

      requestClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isPreviewing, onPreviewChange, requestClose]);

  useEffect(() => {
    if (!accessToken) return;
    void getProfileCosmetics(accessToken).then(setCosmetics).catch(() => setError(t("profile.page.cosmeticsError")));
  }, [accessToken, t]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken || isSaving) return;
    setIsSaving(true); setError("");
    try { onSaved(await (targetIdentifier ? updateProfileByIdentifier(accessToken, targetIdentifier, form) : updateMyProfile(accessToken, form))); }
    catch (exception) { setError(exception instanceof Error ? exception.message : t("profile.page.loadError")); }
    finally { setIsSaving(false); }
  }

  async function handleAvatarUpload(file: File | undefined) {
    if (!file || !accessToken) return;
    setIsUploading(true); setError("");
    try { onSaved(await (targetIdentifier ? uploadProfileAvatarByIdentifier(accessToken, targetIdentifier, file) : uploadMyAvatar(accessToken, file))); }
    catch (exception) { setError(exception instanceof Error ? exception.message : t("profile.page.loadError")); }
    finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  }

  function openPreview() {
    onPreviewChange(form);
    setIsPreviewing(true);
    requestAnimationFrame(() => previewCloseButtonRef.current?.focus());
  }

  function closePreview() {
    setIsPreviewing(false);
    onPreviewChange(null);
    requestAnimationFrame(() => previewButtonRef.current?.focus());
  }

  return createPortal(
    <>
      {isPreviewing ? <aside className="profile-preview-mode" aria-label={t("profile.page.previewMode")}>
          <Eye size={18} aria-hidden="true" />
          <span><strong>{t("profile.page.previewMode")}</strong><small>{t("profile.page.previewUnsaved")}</small></span>
          <button className="profile-preview-mode__close" onClick={closePreview} ref={previewCloseButtonRef} title={t("profile.page.exitPreview")} type="button" aria-label={t("profile.page.exitPreview")}><X size={18} aria-hidden="true" /></button>
        </aside> : null}
      <div aria-hidden={isPreviewing} aria-label={t("profile.page.edit")} aria-modal={!isPreviewing} className={`profile-editor${isPreviewing ? " profile-editor--hidden" : ""}${isClosing ? " modal-layer--closing" : ""}`} role="dialog">
        <form className="profile-editor__sheet" onSubmit={handleSave}>
          <header className="profile-editor__head"><div><span className="profile-kicker"><Pencil size={14} aria-hidden="true" /> {t("profile.page.edit")}</span></div><button className="profile-icon-button" onClick={requestClose} type="button" aria-label={t("profile.page.close")}><X size={20} aria-hidden="true" /></button></header>
          <div className="profile-editor__body">
            {isOwnProfile || canManageSecurity ? <ProfileSecurityEditor accessToken={accessToken ?? ""} isManaged={canManageSecurity} targetIdentifier={targetIdentifier ?? profile.publicId} onFlowChange={setIsSecurityFlowActive} onProfileChanged={onSaved} profile={profile} /> : null}
            {!isSecurityFlowActive ? <>
            <section className="profile-editor__avatar-row"><Avatar profile={{ ...profile, ...form }} /><div><strong>{t("profile.page.avatar")}</strong><p>{t("profile.page.avatarHint")}</p><input accept="image/jpeg,image/png,image/webp" className="profile-file-input" onChange={(event) => void handleAvatarUpload(event.target.files?.[0])} ref={fileInputRef} type="file" /><button className="profile-secondary-button" disabled={isUploading} onClick={() => fileInputRef.current?.click()} type="button">{isUploading ? <LoaderCircle className="profile-spin" size={16} /> : <Camera size={16} />}{isUploading ? t("profile.page.uploading") : t("profile.page.upload")}</button></div></section>
            <div className="profile-form-grid">
              <label className="profile-field"><span>{t("profile.page.nickname")}</span><input value={form.nick} onChange={(event) => updateField("nick", event.target.value)} minLength={3} maxLength={32} required /></label>
              <label className="profile-field"><span>{t("profile.page.birthday")}</span><input value={form.birthDate ?? ""} onChange={(event) => updateField("birthDate", event.target.value || null)} type="date" /></label>
              <label className="profile-field"><span>{t("profile.page.gender")}</span><select value={form.gender} onChange={(event) => updateField("gender", event.target.value)}>{genders.map((gender) => <option key={gender} value={gender}>{t(`profile.page.gender${gender ? gender[0].toUpperCase() + gender.slice(1) : "None"}`)}</option>)}</select></label>
              <label className="profile-field"><span>{t("profile.page.country")}</span><CountryPicker value={form.countryCode} onChange={(countryCode) => updateField("countryCode", countryCode)} /></label>
            </div>
            <label className="profile-field profile-field--wide"><span>{t("profile.page.description")}</span><textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} maxLength={1000} placeholder={t("profile.page.descriptionPlaceholder")} rows={4} /></label>
            <ContactEditor contacts={form.contacts} onChange={(contacts) => updateField("contacts", contacts)} />
            <section className="profile-appearance"><div className="profile-appearance__heading"><div className="profile-section-title"><Sparkles size={16} aria-hidden="true" /> {t("profile.page.appearance")}</div><button aria-checked={hoverOnlyAnimations} className="profile-appearance__animation-toggle" onClick={() => updateHoverOnlyAnimations(!hoverOnlyAnimations)} role="switch" type="button"><span aria-hidden="true" />{t("profile.page.activeAnimationsOnly")}</button></div><AvatarBorderEditor form={form} onChange={updateField} profile={profile} /><CosmeticPicker cosmetics={cosmetics} form={form} hoverOnlyAnimations={hoverOnlyAnimations} onChange={updateField} profile={profile} /></section>
            </> : null}
          </div>
          {!isSecurityFlowActive ? <footer className="profile-editor__footer">{error && <p className="profile-editor__error">{error}</p>}<button className="profile-secondary-button" onClick={requestClose} type="button">{t("profile.page.close")}</button><button className="profile-secondary-button profile-editor__preview-button" onClick={openPreview} ref={previewButtonRef} type="button"><Eye size={17} aria-hidden="true" />{t("profile.page.preview")}</button><button className="profile-primary-button" disabled={isSaving} type="submit">{isSaving ? <LoaderCircle className="profile-spin" size={17} /> : <Save size={17} />}{isSaving ? t("profile.page.saving") : t("profile.page.save")}</button></footer> : null}
        </form>
      </div>
    </>,
    document.body
  );
}
