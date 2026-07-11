export function ChatAvatar({ contact, size = "small", onOpenProfile, label }) {
  const avatar = (
    <span className={`chat-avatar chat-avatar--${size}`} aria-hidden="true">
      <img className="chat-avatar__image" src={contact.avatar} alt="" />
      {contact.frame ? <img className="chat-avatar__frame" src={contact.frame} alt="" /> : null}
      {contact.presence ? <i className={`chat-avatar__presence chat-avatar__presence--${contact.presence}`} /> : null}
    </span>
  );

  if (!onOpenProfile) {
    return avatar;
  }

  return (
    <button className="chat-avatar-button" onClick={onOpenProfile} type="button" aria-label={label}>
      {avatar}
    </button>
  );
}
