import { CalendarDays, Hash, MessageCircle, ShieldCheck, UserRound, X } from "lucide-react";
import { useEffect } from "react";
import { ChatAvatar } from "./ChatAvatar";

export function ChatProfilePreview({ contact, onClose, t }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  if (!contact) {
    return null;
  }

  return (
    <div className="chat-profile-overlay" onPointerDown={(event) => event.target === event.currentTarget && onClose()}>
      <article aria-label={t("chatUi.profile.previewTitle", { name: contact.name })} aria-modal="true" className="chat-profile-card" role="dialog">
        <ProfileMedia className="chat-profile-card__wallpaper" image={contact.wallpaper} video={contact.wallpaperVideo} />
        <div className="chat-profile-card__shade" aria-hidden="true" />
        <button className="chat-profile-card__close" onClick={onClose} type="button" aria-label={t("profile.page.close")}>
          <X size={20} />
        </button>

        <div className="chat-profile-card__content">
          <div className="chat-profile-card__banner">
            <ProfileMedia image={contact.banner} video={contact.bannerVideo} />
          </div>

          <div className="chat-profile-card__identity">
            <ChatAvatar contact={contact} size="profile" />
            <div>
              <h2>{contact.name}</h2>
              <span className={`chat-presence chat-presence--${contact.presence}`}>
                {t(`chatUi.presence.${contact.presence}`)}
              </span>
            </div>
          </div>

          <div className="chat-profile-card__actions">
            <button onClick={onClose} type="button"><MessageCircle size={18} />{t("chatUi.profile.message")}</button>
            <a href={`/profile/${contact.normalizedNick}`}><UserRound size={18} />{t("chatUi.profile.openFull")}</a>
          </div>

          <p className="chat-profile-card__about">{contact.aboutKey ? t(contact.aboutKey) : t("chatUi.profile.defaultAbout")}</p>

          <dl className="chat-profile-card__facts">
            <div><dt><ShieldCheck size={17} />{t("chatUi.profile.status")}</dt><dd>{contact.roleLabel || t("chatUi.profile.member")}</dd></div>
            <div><dt><CalendarDays size={17} />{t("chatUi.profile.memberSince")}</dt><dd>{contact.memberSinceKey ? t(contact.memberSinceKey) : t("chatUi.profile.memberSinceShort")}</dd></div>
            <div><dt><Hash size={17} />{t("chatUi.profile.id")}</dt><dd>{contact.publicId || "100000001"}</dd></div>
          </dl>
        </div>
      </article>
    </div>
  );
}

function ProfileMedia({ className = "", image, video }) {
  if (video) {
    return (
      <video className={className} autoPlay loop muted playsInline poster={image} aria-hidden="true">
        <source src={video} type="video/webm" />
      </video>
    );
  }

  return <img className={className} src={image} alt="" />;
}
