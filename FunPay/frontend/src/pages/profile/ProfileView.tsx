import type { ReactNode } from "react";
import {
  AtSign,
  CalendarDays,
  Check,
  CircleUserRound,
  Crown,
  ExternalLink,
  FileText,
  Globe2,
  Pencil,
  Plus,
  ShieldCheck,
  UsersRound
} from "lucide-react";
import type { PresenceStatus } from "../../api/presenceApi";
import type { ProfileData } from "../../api/profileApi";
import { getCountryName } from "../../data/countries";
import { useLanguage } from "../../i18n";
import { getServiceDefinition } from "./contactServices";
import { formatMembershipDuration, isVideoAsset } from "./profileModel";
import { Avatar, CountryFlag, ProfileBannerVideo } from "./ProfileAvatar";

type ProfileViewProps = {
  canEditProfile: boolean;
  editor: ReactNode;
  onEdit: () => void;
  presenceStatus: PresenceStatus;
  profile: ProfileData;
  savedMessage: { id: number; text: string } | null;
};

export function ProfileView({ canEditProfile, editor, onEdit, presenceStatus, profile, savedMessage }: ProfileViewProps) {
  const { t, language } = useLanguage();
  const genderKey = `profile.page.gender${profile.gender ? profile.gender[0].toUpperCase() + profile.gender.slice(1) : "None"}`;
  const isFemale = profile.gender === "female";
  const teamRole = profile.role === "Owner"
    ? { title: t(isFemale ? "profile.page.ownerFemale" : "profile.page.owner"), className: "owner", Icon: Crown }
    : profile.role === "Admin"
      ? { title: t(isFemale ? "profile.page.administratorFemale" : "profile.page.administrator"), className: "administrator", Icon: ShieldCheck }
      : { title: t("profile.page.member"), className: "member", Icon: ShieldCheck };
  const membershipDuration = formatMembershipDuration(profile.createdAt, language);
  const wallpaperIsVideo = isVideoAsset(profile.selectedWallpaperAsset);
  const bannerIsVideo = isVideoAsset(profile.selectedBannerAsset);

  return (
    <main className="profile-page">
      {profile.selectedWallpaperAsset ? <div className="profile-wallpaper" aria-hidden="true">{wallpaperIsVideo ? <video autoPlay disablePictureInPicture disableRemotePlayback loop muted playsInline preload="metadata" src={profile.selectedWallpaperAsset} /> : <img src={profile.selectedWallpaperAsset} alt="" />}</div> : null}
      <section className={`profile-cover profile-cover--${profile.bannerStyle}`}>
        <div className="profile-cover__media">
          {profile.selectedBannerAsset ? (bannerIsVideo ? <ProfileBannerVideo key={profile.selectedBannerAsset} path={profile.selectedBannerAsset} /> : <img className="profile-cover__asset" src={profile.selectedBannerAsset} alt="" />) : null}
          <div className="profile-cover__spark profile-cover__spark--one" />
          <div className="profile-cover__spark profile-cover__spark--two" />
        </div>
        <div className="profile-cover__body">
          <Avatar profile={profile} />
          <div className="profile-cover__identity">
            <h1>{profile.nick}</h1>
            <div className="profile-cover__chips">
              <div className="profile-cover__quick-chips">
                <span className={`profile-status profile-status--${presenceStatus}`}><i />{t(`profile.page.${presenceStatus}`)}</span>
                <span className="profile-status profile-status--membership"><CalendarDays size={14} aria-hidden="true" /> {t("profile.page.memberFor", { duration: membershipDuration })}</span>
                <span className="profile-status"><strong>ID:</strong> <strong>{profile.publicId}</strong></span>
              </div>
              <span className="profile-status"><ShieldCheck size={14} aria-hidden="true" /> {t("profile.page.teamStatus")}: <span className={`profile-team-role profile-team-role--${teamRole.className}`}><teamRole.Icon size={13} aria-hidden="true" />{teamRole.title}</span></span>
            </div>
          </div>
          {canEditProfile ? <button className="profile-edit-button" onClick={onEdit} type="button"><Pencil size={17} aria-hidden="true" /> {t("profile.page.edit")}</button> : null}
        </div>
      </section>
      {savedMessage && <div className="profile-toast" key={savedMessage.id} role="status"><Check size={16} aria-hidden="true" /> <span>{savedMessage.text}</span></div>}
      <div className="profile-content-grid"><section className="profile-card profile-card--about"><div className="profile-card__heading"><FileText size={19} aria-hidden="true" /><h2>{t("profile.page.about")}</h2></div><p className="profile-description">{profile.description || t("profile.page.notSpecified")}</p><dl className="profile-meta-grid"><div><dt><Globe2 size={15} aria-hidden="true" /> {t("profile.page.country")}</dt><dd>{profile.countryCode ? <><span className="profile-country-flag"><CountryFlag code={profile.countryCode} /></span> {getCountryName(profile.countryCode, language)}</> : t("profile.page.countryNone")}</dd></div><div><dt><CalendarDays size={15} aria-hidden="true" /> {t("profile.page.birthday")}</dt><dd>{profile.birthDate ? new Intl.DateTimeFormat(language === "uk" ? "uk-UA" : "ru-RU").format(new Date(`${profile.birthDate}T00:00:00`)) : t("profile.page.notSpecified")}</dd></div><div><dt><UsersRound size={15} aria-hidden="true" /> {t("profile.page.gender")}</dt><dd>{t(genderKey)}</dd></div></dl></section>
      <aside className="profile-card profile-card--contacts"><div className="profile-card__heading"><AtSign size={19} aria-hidden="true" /><h2>{t("profile.page.contacts")}</h2></div><div className="profile-contact-list">{profile.contacts.length ? profile.contacts.map((contact) => { const { Icon } = getServiceDefinition(contact.service); return <a className="profile-contact" href={contact.url} key={`${contact.service}-${contact.position}`} rel="noreferrer" target="_blank"><Icon size={18} aria-hidden="true" /><span><strong>{contact.title}</strong><small>{contact.url}</small></span><ExternalLink size={15} aria-hidden="true" /></a>; }) : <div className="profile-contact-empty"><CircleUserRound size={22} aria-hidden="true" /><p>{t("profile.page.noContacts")}</p>{canEditProfile ? <button className="profile-secondary-button" onClick={onEdit} type="button"><Plus size={16} aria-hidden="true" /> {t("profile.page.addContact")}</button> : null}</div>}</div></aside></div>
      {editor}
    </main>
  );
}
