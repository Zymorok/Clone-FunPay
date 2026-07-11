import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BellOff,
  CalendarDays,
  Camera,
  Check,
  CheckCheck,
  ChevronDown,
  CircleAlert,
  Clock3,
  EllipsisVertical,
  FileText,
  Image,
  Keyboard,
  LayoutList,
  ListChecks,
  LoaderCircle,
  MapPin,
  MessageCircleMore,
  Mic,
  Pause,
  Paperclip,
  Play,
  Search,
  Send,
  Settings2,
  Smile,
  Trash2,
  UserRound,
  Video,
  X
} from "lucide-react";
import {
  createChatConnection,
  getChatConversations,
  getChatMessages,
  getChatMessagesAroundDate,
  markChatRead,
  sendChatMessage,
  stopChatConnection
} from "../api/chatApi";
import { getApiAssetUrl } from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";
import { useLanguage } from "../i18n";
import { ChatAvatar } from "./chat/ChatAvatar";
import { ChatMediaPicker } from "./chat/ChatMediaPicker";
import { ChatProfilePreview } from "./chat/ChatProfilePreview";
import { VideoNoteRecorder, VoiceRecordingBar } from "./chat/ChatRecorder";
import { contacts as demoContacts, cosmeticsRoot, emojiItems, initialMessagesByContact, ownProfileCosmetics } from "./chat/chatData";
import { formatRecordingDuration, useChatRecorder } from "./chat/useChatRecorder";

const defaultChatWallpaper = "/assets/website/backgrounds/routes/background_chat.webm";
const demoOrder = {
  id: 10482,
  title: "2 050 Valorant Points",
  game: "Valorant",
  price: 2050,
  status: "InProgress",
  createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
};
const siteEmojiByName = new Map(emojiItems.map((item) => [item.name.toLocaleLowerCase(), item]));
const voiceWaveform = [0.28, 0.52, 0.36, 0.74, 0.44, 0.86, 0.58, 0.32, 0.68, 0.94, 0.48, 0.72, 0.38, 0.82, 0.55, 0.33, 0.66, 0.88, 0.46, 0.76, 0.4, 0.62, 0.9, 0.5, 0.7, 0.34, 0.8, 0.56, 0.92, 0.42, 0.64, 0.3];

function buildDemoContacts() {
  return demoContacts.map((contact, index) => ({
    ...contact,
    orderId: 10482 + index,
    order: index === 0 ? demoOrder : null,
    preview: null
  }));
}

function buildDemoThreads() {
  const result = {};
  const now = new Date();

  for (const [contactId, messages] of Object.entries(initialMessagesByContact)) {
    result[contactId] = messages.map((message, index) => {
      const daysAgo = contactId === "alyndra" && index < 3 ? 3 : 0;
      const createdAt = new Date(now);
      createdAt.setDate(createdAt.getDate() - daysAgo);
      const [hours, minutes] = message.time.split(":").map(Number);
      createdAt.setHours(hours, minutes, 0, 0);
      return { ...message, createdAt: createdAt.toISOString(), status: "sent" };
    });
  }

  return result;
}

export function Chat() {
  const { t } = useLanguage();
  const { accessToken, user } = useAuth();
  const [chatContacts, setChatContacts] = useState(buildDemoContacts);
  const [activeId, setActiveId] = useState(demoContacts[0].id);
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState("classic");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isMediaPinned, setIsMediaPinned] = useState(false);
  const [emojiAutoSend, setEmojiAutoSend] = useState(false);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()));
  const [pendingScrollDate, setPendingScrollDate] = useState(null);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [draft, setDraft] = useState("");
  const [previewContact, setPreviewContact] = useState(null);
  const [messageThreads, setMessageThreads] = useState(buildDemoThreads);
  const [historyByContact, setHistoryByContact] = useState({});
  const [isLiveData, setIsLiveData] = useState(false);
  const [chatNotice, setChatNotice] = useState(null);
  const [mobilePane, setMobilePane] = useState("list");
  const menuRef = useRef(null);
  const mediaRef = useRef(null);
  const messagesRef = useRef(null);
  const messagesEndRef = useRef(null);
  const searchRef = useRef(null);
  const draftRef = useRef(null);
  const localMediaUrlsRef = useRef(new Set());
  const recorder = useChatRecorder({ onComplete: handleRecordingComplete });
  const emojiProfileKey = String(user?.id ?? user?.publicId ?? "guest");

  const activeContact = chatContacts.find((contact) => contact.id === activeId) ?? chatContacts[0] ?? null;
  const messages = activeContact ? messageThreads[activeContact.id] ?? [] : [];
  const history = activeContact ? historyByContact[activeContact.id] : null;
  const filteredContacts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return normalizedQuery
      ? chatContacts.filter((contact) => contact.name.toLocaleLowerCase().includes(normalizedQuery))
      : chatContacts;
  }, [chatContacts, query]);
  const availableDates = useMemo(() => {
    return [...new Set(messages.map((message) => getLocalDateKey(message.createdAt)))].reverse();
  }, [messages]);

  const ownAvatar = {
    id: "current-user",
    name: user?.nick || "Xqzmyy",
    normalizedNick: user?.normalizedNick || "xqzmyy",
    publicId: user?.publicId || "100000001",
    avatar: user?.selectedAvatarAsset || getApiAssetUrl(user?.avatarUrl ?? "") || `${cosmeticsRoot}/avatars/11/011__good-mood__cover.webp`,
    frame: user?.selectedFrameAsset || `${cosmeticsRoot}/frames/02/002__icicles__cover.webp`,
    presence: "online",
    roleLabel: user?.role === "Owner"
      ? t(user?.gender === "female" ? "profile.page.ownerFemale" : "profile.page.owner")
      : user?.role === "Admin"
        ? t(user?.gender === "female" ? "profile.page.administratorFemale" : "profile.page.administrator")
        : t("chatUi.profile.member"),
    memberSinceKey: "chatUi.profile.memberSinceShort",
    aboutKey: "chatUi.profile.defaultAbout",
    ...ownProfileCosmetics
  };
  const chatWallpaper = user?.selectedWallpaperAsset || defaultChatWallpaper;
  const wallpaperIsVideo = /\.(webm|mp4)(\?.*)?$/i.test(chatWallpaper);

  useEffect(() => {
    setEmojiAutoSend(localStorage.getItem(`funpay-chat-emoji-auto-send:v1:${emojiProfileKey}`) === "true");
  }, [emojiProfileKey]);

  useEffect(() => {
    if (!accessToken || !user?.id) {
      return undefined;
    }

    let isCancelled = false;
    let connection = null;

    void getChatConversations(accessToken)
      .then(async (conversations) => {
        if (isCancelled || conversations.length === 0) {
          return;
        }

        const mappedContacts = conversations.map(mapConversationToContact);
        setChatContacts(mappedContacts);
        setActiveId((currentId) => mappedContacts.some((contact) => contact.id === currentId) ? currentId : mappedContacts[0].id);
        setMessageThreads({});
        setIsLiveData(true);

        connection = createChatConnection(
          accessToken,
          (incoming) => {
            const contactId = `order-${incoming.orderId}`;
            const mappedMessage = mapApiMessage(incoming, user.id);
            setMessageThreads((current) => ({
              ...current,
              [contactId]: upsertMessage(current[contactId] ?? [], mappedMessage)
            }));
            if (incoming.senderId !== user.id) {
              setChatContacts((current) => current.map((contact) => contact.id === contactId
                ? { ...contact, preview: incoming.text, unread: contact.id === activeId ? 0 : (contact.unread ?? 0) + 1 }
                : contact));
            }
          },
          ({ orderId, readerId, readAt }) => {
            if (readerId === user.id) {
              return;
            }

            const contactId = `order-${orderId}`;
            setMessageThreads((current) => ({
              ...current,
              [contactId]: (current[contactId] ?? []).map((message) => message.side === "outgoing"
                ? { ...message, read: true, readAt }
                : message)
            }));
          }
        );
        await connection.start();
      })
      .catch(() => {
        // В режиме разработки оставляем демонстрационный чат, если backend ещё не обновлён.
      });

    return () => {
      isCancelled = true;
      void stopChatConnection(connection);
    };
  }, [accessToken, user?.id]);

  useEffect(() => {
    if (!isLiveData || !accessToken || !activeContact?.orderId) {
      return;
    }

    let isCancelled = false;
    void getChatMessages(accessToken, activeContact.orderId)
      .then((page) => {
        if (isCancelled) {
          return;
        }

        setMessageThreads((current) => ({
          ...current,
          [activeContact.id]: page.items.map((message) => mapApiMessage(message, user.id))
        }));
        setHistoryByContact((current) => ({
          ...current,
          [activeContact.id]: { hasMore: page.hasMore, beforeId: page.nextBeforeId, loading: false }
        }));
        void markChatRead(accessToken, activeContact.orderId);
        setChatContacts((current) => current.map((contact) => contact.id === activeContact.id
          ? { ...contact, unread: 0 }
          : contact));
      })
      .catch(() => setChatNotice(t("chatUi.loadFailed")));

    return () => {
      isCancelled = true;
    };
  }, [accessToken, activeContact?.id, activeContact?.orderId, isLiveData, user?.id, t]);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const closeMenu = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, [isMenuOpen]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      setIsMenuOpen(false);
      setIsMediaOpen(false);
      setIsMediaPinned(false);
      setIsAttachOpen(false);
      setIsShortcutsOpen(false);
      setIsDateOpen(false);
      void recorder.cancel();
    };

    const runShortcut = (event) => {
      const target = event.target;
      const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        setIsDateOpen(true);
      } else if (!isTyping && event.key === "?") {
        event.preventDefault();
        setIsShortcutsOpen(true);
      } else if (!isTyping && event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        event.preventDefault();
        const currentIndex = chatContacts.findIndex((contact) => contact.id === activeId);
        const direction = event.key === "ArrowDown" ? 1 : -1;
        const nextIndex = (currentIndex + direction + chatContacts.length) % chatContacts.length;
        if (chatContacts[nextIndex]) {
          setActiveId(chatContacts[nextIndex].id);
        }
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("keydown", runShortcut);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("keydown", runShortcut);
    };
  }, [activeId, chatContacts, recorder.cancel]);

  useEffect(() => {
    if (recorder.status === "requesting" || recorder.status === "recording") {
      setChatNotice(null);
    }
  }, [recorder.status]);

  useEffect(() => {
    return () => {
      localMediaUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      localMediaUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (pendingScrollDate) {
      document.querySelector(`[data-chat-date="${pendingScrollDate}"]`)?.scrollIntoView({ block: "center" });
      setPendingScrollDate(null);
      return;
    }

    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [activeId, messages.length, pendingScrollDate]);

  async function loadOlderMessages() {
    if (!isLiveData || !accessToken || !activeContact?.orderId || !history?.hasMore || history.loading) {
      return;
    }

    const container = messagesRef.current;
    const previousHeight = container?.scrollHeight ?? 0;
    setHistoryByContact((current) => ({
      ...current,
      [activeContact.id]: { ...history, loading: true }
    }));

    try {
      const page = await getChatMessages(accessToken, activeContact.orderId, history.beforeId);
      setMessageThreads((current) => ({
        ...current,
        [activeContact.id]: mergeMessages(page.items.map((message) => mapApiMessage(message, user.id)), current[activeContact.id] ?? [])
      }));
      setHistoryByContact((current) => ({
        ...current,
        [activeContact.id]: { hasMore: page.hasMore, beforeId: page.nextBeforeId, loading: false }
      }));
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - previousHeight;
        }
      });
    } catch {
      setHistoryByContact((current) => ({
        ...current,
        [activeContact.id]: { ...history, loading: false }
      }));
      setChatNotice(t("chatUi.loadFailed"));
    }
  }

  async function goToDate(date) {
    setSelectedDate(date);
    setIsDateOpen(false);

    if (!isLiveData || !accessToken || !activeContact?.orderId) {
      setPendingScrollDate(date);
      return;
    }

    try {
      const page = await getChatMessagesAroundDate(accessToken, activeContact.orderId, date);
      setMessageThreads((current) => ({
        ...current,
        [activeContact.id]: page.items.map((message) => mapApiMessage(message, user.id))
      }));
      setHistoryByContact((current) => ({
        ...current,
        [activeContact.id]: { hasMore: page.hasMore, beforeId: page.nextBeforeId, loading: false }
      }));
      setPendingScrollDate(date);
    } catch {
      setChatNotice(t("chatUi.dateNotFound"));
    }
  }

  async function sendDraft(textOverride = null) {
    const hasTextOverride = typeof textOverride === "string";
    const text = (hasTextOverride ? textOverride : draft).trim();
    if (!text || !activeContact) {
      return;
    }

    const temporaryId = `local-${Date.now()}`;
    const temporaryMessage = {
      id: temporaryId,
      side: "outgoing",
      text,
      createdAt: new Date().toISOString(),
      time: formatTime(new Date()),
      read: false,
      status: isLiveData ? "sending" : "sent"
    };
    appendMessage(activeContact.id, temporaryMessage);
    if (!hasTextOverride) {
      setDraft("");
    }

    if (!isLiveData || !accessToken || !activeContact.orderId) {
      return;
    }

    try {
      const saved = await sendChatMessage(accessToken, activeContact.orderId, text);
      const mappedMessage = mapApiMessage(saved, user.id);
      setMessageThreads((current) => ({
        ...current,
        [activeContact.id]: upsertMessage(
          (current[activeContact.id] ?? []).filter((message) => message.id !== temporaryId),
          mappedMessage
        )
      }));
    } catch {
      setMessageThreads((current) => ({
        ...current,
        [activeContact.id]: (current[activeContact.id] ?? []).map((message) => message.id === temporaryId
          ? { ...message, status: "error" }
          : message)
      }));
    }
  }

  function appendMessage(contactId, message) {
    setMessageThreads((current) => ({
      ...current,
      [contactId]: [...(current[contactId] ?? []), message]
    }));
  }

  function sendSiteMedia(item) {
    if (!activeContact) {
      return;
    }

    appendMessage(activeContact.id, {
      id: `local-${Date.now()}`,
      side: "outgoing",
      kind: item.kind,
      asset: item.asset,
      createdAt: new Date().toISOString(),
      time: formatTime(new Date()),
      read: true,
      status: "sent"
    });
  }

  function insertEmojiIntoDraft(value) {
    const textarea = draftRef.current;
    const selectionStart = textarea?.selectionStart ?? draft.length;
    const selectionEnd = textarea?.selectionEnd ?? draft.length;
    const nextCursorPosition = selectionStart + value.length;
    setDraft((current) => `${current.slice(0, selectionStart)}${value}${current.slice(selectionEnd)}`);
    window.requestAnimationFrame(() => {
      draftRef.current?.focus();
      draftRef.current?.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  }

  function handleMediaSelect(item) {
    if (item.kind !== "emoji") {
      sendSiteMedia(item);
      return;
    }

    if (emojiAutoSend) {
      if (item.emoji) {
        void sendDraft(item.emoji);
      } else {
        sendSiteMedia(item);
      }
      return;
    }

    insertEmojiIntoDraft(item.emoji ?? `:${item.name}:`);
  }

  function changeEmojiAutoSend(enabled) {
    setEmojiAutoSend(enabled);
    localStorage.setItem(`funpay-chat-emoji-auto-send:v1:${emojiProfileKey}`, String(enabled));
  }

  function closeMediaPicker() {
    setIsMediaOpen(false);
    setIsMediaPinned(false);
  }

  function toggleMediaPickerPinned() {
    setIsMediaPinned((current) => {
      const next = !current;
      setIsMediaOpen(next);
      return next;
    });
  }

  function chooseAttachment(kind, files = [], fallbackLabel = "") {
    const file = files[0] ?? null;
    const resolvedKind = file
      ? file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : "document"
      : kind;
    const asset = file ? URL.createObjectURL(file) : null;

    setPendingAttachment((current) => {
      if (current?.asset && !localMediaUrlsRef.current.has(current.asset)) {
        URL.revokeObjectURL(current.asset);
      }
      return {
        asset,
        file,
        fileName: file?.name ?? fallbackLabel,
        kind: resolvedKind,
        label: file?.name ?? fallbackLabel
      };
    });
    setIsAttachOpen(false);
    draftRef.current?.focus();
  }

  function handleRecordingComplete({ blob, duration, mode }) {
    const asset = URL.createObjectURL(blob);
    const isVoice = mode === "voice";
    if (!activeContact) {
      URL.revokeObjectURL(asset);
      return;
    }

    localMediaUrlsRef.current.add(asset);
    appendMessage(activeContact.id, {
      id: `local-recording-${Date.now()}`,
      side: "outgoing",
      kind: isVoice ? "voice" : "video-note",
      asset,
      duration,
      fileName: isVoice ? t("chatCapture.voiceFileName") : t("chatCapture.videoFileName"),
      text: isVoice ? t("chatCapture.voiceReady") : t("chatCapture.videoReady"),
      createdAt: new Date().toISOString(),
      time: formatTime(new Date()),
      read: true,
      status: "sent"
    });
    setChatNotice(null);
  }

  function discardPendingAttachment() {
    setPendingAttachment((current) => {
      if (current?.asset && !localMediaUrlsRef.current.has(current.asset)) {
        URL.revokeObjectURL(current.asset);
      }
      return null;
    });
  }

  function sendPendingAttachment() {
    if (!activeContact || !pendingAttachment) {
      return;
    }

    if (pendingAttachment.asset) {
      localMediaUrlsRef.current.add(pendingAttachment.asset);
    }
    appendMessage(activeContact.id, {
      id: `local-media-${Date.now()}`,
      side: "outgoing",
      kind: pendingAttachment.kind,
      asset: pendingAttachment.asset,
      duration: pendingAttachment.duration,
      fileName: pendingAttachment.fileName,
      text: pendingAttachment.label,
      createdAt: new Date().toISOString(),
      time: formatTime(new Date()),
      read: true,
      status: "sent"
    });
    setPendingAttachment(null);
  }

  function handlePaste(event) {
    const file = [...event.clipboardData.files].find((item) => item.type.startsWith("image/") || item.type.startsWith("video/"));
    if (file) {
      chooseAttachment(file.type.startsWith("video/") ? "video" : "image", [file], file.name || t("chatUi.attachments.clipboard"));
    }
  }

  if (!activeContact) {
    return (
      <main className="chat-page">
        <section className="chat-shell chat-shell--empty">
          <MessageCircleMore size={38} />
          <h1>{t("chatUi.noChats")}</h1>
          <p>{t("chatUi.noChatsHint")}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="chat-page" aria-label={t("chatUi.title")}>
      <section className="chat-shell" data-mobile-pane={mobilePane}>
        <aside className="chat-sidebar">
          <header className="chat-sidebar__header">
            <div><span className="chat-sidebar__eyebrow">FunPay</span><h1>{t("chatUi.title")}</h1></div>
            <button className="chat-icon-button" type="button" aria-label={t("chatUi.settings")}><Settings2 size={19} /></button>
          </header>

          <label className="chat-search">
            <Search size={17} aria-hidden="true" />
            <input ref={searchRef} aria-label={t("chatUi.search")} onChange={(event) => setQuery(event.target.value)} placeholder={t("chatUi.search")} type="search" value={query} />
            <kbd>Ctrl K</kbd>
          </label>

          <div className="chat-list" aria-label={t("chatUi.conversations")}>
            {filteredContacts.length ? filteredContacts.map((contact) => (
              <div className={`chat-list-item${contact.id === activeContact.id ? " is-active" : ""}`} key={contact.id}>
                <ChatAvatar contact={contact} label={t("chatUi.profile.openPreview", { name: contact.name })} onOpenProfile={() => setPreviewContact(contact)} size="medium" />
                <button className="chat-list-item__select" onClick={() => { setActiveId(contact.id); setMobilePane("chat"); }} type="button">
                  <span className="chat-list-item__body">
                    <span className="chat-list-item__topline"><strong>{contact.name}</strong><time>{formatContactTime(contact, t)}</time></span>
                    <span className="chat-list-item__bottomline"><span>{contact.preview ?? t(contact.previewKey)}</span>{contact.unread ? <b aria-label={t("chatUi.unread", { count: contact.unread })}>{contact.unread}</b> : null}</span>
                  </span>
                </button>
              </div>
            )) : (
              <div className="chat-list-empty"><MessageCircleMore size={28} /><strong>{t("chatUi.emptySearch")}</strong><span>{t("chatUi.emptySearchHint")}</span></div>
            )}
          </div>
        </aside>

        <section className="chat-conversation">
          <header className="chat-conversation__header">
            <button className="chat-icon-button chat-mobile-back" onClick={() => setMobilePane("list")} type="button" aria-label={t("chatUi.backToChats")}><ArrowLeft size={20} /></button>
            <ChatAvatar contact={activeContact} label={t("chatUi.profile.openPreview", { name: activeContact.name })} onOpenProfile={() => setPreviewContact(activeContact)} size="small" />
            <div className="chat-conversation__identity"><strong>{activeContact.name}</strong><span className={`chat-presence chat-presence--${activeContact.presence}`}>{t(`chatUi.presence.${activeContact.presence}`)}</span></div>
            {isMuted ? <BellOff className="chat-header-muted" size={17} aria-label={t("chatUi.muted")} /> : null}
            <button className={`chat-icon-button${isDateOpen ? " is-active" : ""}`} onClick={() => setIsDateOpen((value) => !value)} type="button" aria-label={t("chatUi.date.open")}><CalendarDays size={19} /></button>
            <div className="chat-actions" ref={menuRef}>
              <button aria-expanded={isMenuOpen} aria-haspopup="menu" aria-label={t("chatUi.openMenu")} className={`chat-icon-button${isMenuOpen ? " is-active" : ""}`} onClick={() => setIsMenuOpen((value) => !value)} type="button"><EllipsisVertical size={21} /></button>
              <div className="chat-menu" data-state={isMenuOpen ? "open" : "closed"} role="menu" inert={!isMenuOpen}>
                <button onClick={() => setIsMuted((value) => !value)} role="menuitemcheckbox" aria-checked={isMuted} type="button"><BellOff size={18} /><span><strong>{isMuted ? t("chatUi.enableNotifications") : t("chatUi.disableNotifications")}</strong><small>{isMuted ? t("chatUi.notificationsOff") : t("chatUi.notificationsOn")}</small></span></button>
                <a href={`/profile/${activeContact.normalizedNick}`} role="menuitem"><UserRound size={18} /><span><strong>{t("chatUi.showProfile")}</strong><small>/profile/{activeContact.normalizedNick}</small></span></a>
                <button onClick={() => { setIsMenuOpen(false); setIsShortcutsOpen(true); }} role="menuitem" type="button"><Keyboard size={18} /><span><strong>{t("chatUi.shortcuts.title")}</strong><small>{t("chatUi.shortcuts.hint")}</small></span></button>
                <div className="chat-menu__divider" />
                <div className="chat-menu__layout"><span><LayoutList size={17} />{t("chatUi.messageLayout")}</span><label className={layout === "classic" ? "is-selected" : ""}><input checked={layout === "classic"} name="message-layout" onChange={() => setLayout("classic")} type="radio" /><span>{t("chatUi.layoutClassic")}</span></label><label className={layout === "left" ? "is-selected" : ""}><input checked={layout === "left"} name="message-layout" onChange={() => setLayout("left")} type="radio" /><span>{t("chatUi.layoutLeft")}</span></label></div>
                <div className="chat-menu__divider" />
                <button className="chat-menu__danger" role="menuitem" type="button"><Trash2 size={18} /><span><strong>{t("chatUi.deleteChat")}</strong><small>{t("chatUi.deleteChatHint")}</small></span></button>
              </div>
            </div>
            <DateNavigator dates={availableDates} isOpen={isDateOpen} onClose={() => setIsDateOpen(false)} onGo={goToDate} selectedDate={selectedDate} setSelectedDate={setSelectedDate} t={t} />
          </header>

          <div className={`chat-thread chat-thread--${layout}`}>
            {wallpaperIsVideo ? <video className="chat-thread__wallpaper" autoPlay loop muted playsInline disablePictureInPicture aria-hidden="true" src={chatWallpaper} /> : <img className="chat-thread__wallpaper" src={chatWallpaper} alt="" aria-hidden="true" />}
            <div className="chat-thread__shade" aria-hidden="true" />
            <div className="chat-thread__messages" ref={messagesRef} onScroll={(event) => { if (event.currentTarget.scrollTop < 80) void loadOlderMessages(); }}>
              {history?.hasMore ? <button className="chat-history-loader" disabled={history.loading} onClick={loadOlderMessages} type="button">{history.loading ? <LoaderCircle className="is-spinning" size={15} /> : <Clock3 size={15} />}{t("chatUi.loadEarlier")}</button> : null}
              {renderMessageTimeline(messages, { activeContact, layout, onOpenProfile: setPreviewContact, order: activeContact.order, ownAvatar, t })}
              <span className="chat-thread__end" ref={messagesEndRef} />
            </div>
          </div>

          <footer className="chat-composer" ref={mediaRef}>
            <AttachmentMenu isOpen={isAttachOpen} onChoose={chooseAttachment} onOpenChange={setIsAttachOpen} t={t} />
            <div className="chat-composer__field">
              {recorder.mode === "voice" ? (
                <VoiceRecordingBar recorder={recorder} t={t} />
              ) : (
                <textarea ref={draftRef} aria-label={t("chatUi.messagePlaceholder")} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendDraft(); } }} onPaste={handlePaste} placeholder={t("chatUi.messagePlaceholder")} rows={1} value={draft} />
              )}
              {recorder.mode !== "voice" ? (
                <div className="chat-emoji-control" data-open={isMediaOpen} data-pinned={isMediaPinned} onMouseEnter={() => setIsMediaOpen(true)} onMouseLeave={() => { if (!isMediaPinned) setIsMediaOpen(false); }}>
                  <span className="chat-emoji-control__hover-zone" aria-hidden="true" />
                  <ChatMediaPicker autoSendEmoji={emojiAutoSend} isOpen={isMediaOpen} onAutoSendChange={changeEmojiAutoSend} onClose={closeMediaPicker} onSelect={handleMediaSelect} profileKey={emojiProfileKey} t={t} />
                  <button aria-expanded={isMediaOpen} aria-label={t("chatUi.emoji")} className={isMediaOpen ? "is-active" : ""} onClick={toggleMediaPickerPinned} type="button"><Smile size={21} /></button>
                </div>
              ) : null}
            </div>
            {!draft && !recorder.mode ? <button className="chat-record-button" onClick={() => void recorder.start("voice")} type="button" aria-label={t("chatUi.record.voice")}><Mic size={19} /></button> : null}
            {!draft && !recorder.mode ? <button className="chat-record-button" onClick={() => void recorder.start("video")} type="button" aria-label={t("chatUi.record.video")}><Video size={19} /></button> : null}
            {draft ? <button className="chat-send-button" onClick={() => void sendDraft()} type="button" aria-label={t("chatUi.send")}><Send size={20} /></button> : null}
            {pendingAttachment ? <AttachmentDraft attachment={pendingAttachment} onCancel={discardPendingAttachment} onSend={sendPendingAttachment} t={t} /> : null}
          </footer>
        </section>
      </section>
      {chatNotice ? <button className="chat-toast" onClick={() => setChatNotice(null)} type="button">{chatNotice}</button> : null}
      {isShortcutsOpen ? <ShortcutsDialog onClose={() => setIsShortcutsOpen(false)} t={t} /> : null}
      {recorder.mode === "video" ? <VideoNoteRecorder recorder={recorder} t={t} /> : null}
      <ChatProfilePreview contact={previewContact} onClose={() => setPreviewContact(null)} t={t} />
    </main>
  );
}

function AttachmentMenu({ isOpen, onChoose, onOpenChange, t }) {
  const allFilesRef = useRef(null);
  const mediaFilesRef = useRef(null);
  const documentFilesRef = useRef(null);
  const items = [
    { icon: Image, inputRef: mediaFilesRef, key: "photoVideo", kind: "media" },
    { icon: FileText, inputRef: documentFilesRef, key: "document", kind: "document" },
    { icon: ListChecks, key: "tasks", kind: "tasks" },
    { icon: MapPin, key: "location", kind: "location" }
  ];

  function openFilePicker(inputRef) {
    onOpenChange(false);
    inputRef.current?.click();
  }

  function handleFiles(event, kind) {
    const files = [...event.currentTarget.files];
    if (files.length) {
      onChoose(kind, files, files[0].name);
    }
    event.currentTarget.value = "";
  }

  return (
    <div className="chat-attach" data-open={isOpen} onMouseEnter={() => onOpenChange(true)} onMouseLeave={() => onOpenChange(false)}>
      <span className="chat-attach__hover-zone" aria-hidden="true" />
      <input className="chat-attach__file-input" ref={allFilesRef} onChange={(event) => handleFiles(event, "all")} type="file" />
      <input accept="image/*,video/*" className="chat-attach__file-input" ref={mediaFilesRef} onChange={(event) => handleFiles(event, "media")} type="file" />
      <input accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,application/pdf,text/plain" className="chat-attach__file-input" ref={documentFilesRef} onChange={(event) => handleFiles(event, "document")} type="file" />
      <button aria-expanded={isOpen} aria-haspopup="menu" className={`chat-icon-button${isOpen ? " is-active" : ""}`} onClick={() => openFilePicker(allFilesRef)} type="button" aria-label={t("chatCapture.attachAllFiles")}><Paperclip size={21} /></button>
      <div className="chat-attach-menu" data-state={isOpen ? "open" : "closed"} role="menu">
        {items.map(({ icon: Icon, inputRef, key, kind }) => <button key={key} onClick={() => inputRef ? openFilePicker(inputRef) : onChoose(kind, [], t(`chatUi.attachments.${key}`))} role="menuitem" type="button"><Icon size={20} /><span>{t(`chatUi.attachments.${key}`)}</span></button>)}
      </div>
    </div>
  );
}

function AttachmentDraft({ attachment, onCancel, onSend, t }) {
  return (
    <div className={`chat-attachment-draft chat-attachment-draft--${attachment.kind}`}>
      <div className="chat-attachment-draft__preview">
        {attachment.kind === "image" ? <img alt="" src={attachment.asset} /> : null}
        {attachment.kind === "video" || attachment.kind === "video-note" ? <video muted playsInline preload="metadata" src={attachment.asset} /> : null}
        {attachment.kind === "voice" ? <Mic size={20} /> : null}
        {!(["image", "video", "video-note", "voice"].includes(attachment.kind)) ? <FileText size={20} /> : null}
      </div>
      <div className="chat-attachment-draft__copy"><span>{attachment.label}</span><small>{t("chatCapture.readyToSend")}</small></div>
      <button className="chat-attachment-draft__cancel" onClick={onCancel} type="button" aria-label={t("chatUi.record.cancel")}><X size={16} /></button>
      <button className="chat-attachment-draft__send" onClick={onSend} type="button" aria-label={t("chatCapture.sendAttachment")}><Send size={16} /></button>
    </div>
  );
}

function DateNavigator({ dates, isOpen, onClose, onGo, selectedDate, setSelectedDate, t }) {
  return (
    <div className="chat-date-popover" data-state={isOpen ? "open" : "closed"}>
      <header><div><strong>{t("chatUi.date.title")}</strong><small>{t("chatUi.date.hint")}</small></div><button onClick={onClose} type="button" aria-label={t("chatUi.record.cancel")}><X size={17} /></button></header>
      <label><CalendarDays size={17} /><input max={toDateInputValue(new Date())} onChange={(event) => setSelectedDate(event.target.value)} type="date" value={selectedDate} /></label>
      <button className="chat-date-popover__go" disabled={!selectedDate} onClick={() => onGo(selectedDate)} type="button">{t("chatUi.date.go")}</button>
      {dates.length ? <div className="chat-date-popover__recent"><span>{t("chatUi.date.recent")}</span>{dates.slice(0, 4).map((date) => <button key={date} onClick={() => onGo(date)} type="button">{formatDateLabel(date, t)}</button>)}</div> : null}
    </div>
  );
}

function ShortcutsDialog({ onClose, t }) {
  const shortcuts = [
    ["Enter", "send"],
    ["Shift + Enter", "newLine"],
    ["Ctrl + K", "search"],
    ["Ctrl + Shift + D", "date"],
    ["Alt + ↑ / ↓", "switchChat"],
    ["Ctrl + V", "paste"],
    ["?", "openHelp"],
    ["Esc", "close"]
  ];

  return (
    <div className="chat-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="chat-shortcuts-dialog" role="dialog" aria-modal="true" aria-labelledby="chat-shortcuts-title">
        <header><div><Keyboard size={21} /><div><h2 id="chat-shortcuts-title">{t("chatUi.shortcuts.title")}</h2><p>{t("chatUi.shortcuts.subtitle")}</p></div></div><button onClick={onClose} type="button" aria-label={t("chatUi.record.cancel")}><X size={20} /></button></header>
        <div className="chat-shortcuts-list">{shortcuts.map(([keys, action]) => <div key={action}><span>{t(`chatUi.shortcuts.${action}`)}</span><kbd>{keys}</kbd></div>)}</div>
      </section>
    </div>
  );
}

function renderMessageTimeline(messages, context) {
  const nodes = [];
  let lastDate = null;

  for (const message of messages) {
    const date = getLocalDateKey(message.createdAt);
    if (date !== lastDate) {
      nodes.push(<span className="chat-date-pill" data-chat-date={date} key={`date-${date}`}>{formatDateLabel(date, context.t)}</span>);
      lastDate = date;
    }

    const sender = message.side === "outgoing" ? context.ownAvatar : context.activeContact;
    nodes.push(<MessageBubble key={message.id} layout={context.layout} message={message} onOpenProfile={() => context.onOpenProfile(sender)} order={context.order} sender={sender} t={context.t} />);
  }

  return nodes;
}

function MessageBubble({ layout, message, onOpenProfile, order, sender, t }) {
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const showAvatar = layout === "left" || message.side === "incoming";
  const isSiteMedia = message.kind === "sticker" || message.kind === "emoji";
  const isLocalMedia = ["image", "video", "video-note", "voice", "document"].includes(message.kind);

  return (
    <div className={`chat-message chat-message--${message.side}${isSiteMedia ? ` chat-message--${message.kind}` : ""}${isLocalMedia ? ` chat-message--${message.kind}` : ""}${message.status === "error" ? " is-error" : ""}`}>
      {showAvatar ? <ChatAvatar contact={sender} label={t("chatUi.profile.openPreview", { name: sender.name })} onOpenProfile={onOpenProfile} size="tiny" /> : null}
      {isSiteMedia ? (
        <div className="chat-site-media"><img src={message.asset} alt={message.kind === "sticker" ? t("chatUi.stickerAlt") : t("chatUi.media.emojiAlt")} /><MessageTime message={message} t={t} /></div>
      ) : isLocalMedia ? (
        <div className="chat-local-media">
          {message.kind === "image" ? <img alt={message.fileName || t("chatCapture.imageAlt")} src={message.asset} /> : null}
          {message.kind === "video" ? <video controls playsInline preload="metadata" src={message.asset} /> : null}
          {message.kind === "video-note" ? <VideoNotePlayer message={message} t={t} /> : null}
          {message.kind === "voice" ? <VoiceMessagePlayer message={message} t={t} /> : null}
          {message.kind === "document" ? <a className="chat-document-message" download={message.fileName} href={message.asset}><FileText size={22} /><span><strong>{message.fileName}</strong><small>{t("chatCapture.openDocument")}</small></span></a> : null}
          <MessageTime message={message} t={t} />
        </div>
      ) : (
        <div className={`chat-bubble${message.kind === "order" ? " chat-bubble--order" : ""}`}>
          {layout === "left" ? <strong className="chat-bubble__sender">{sender.name}</strong> : null}
          {message.kind === "order" ? (
            <button aria-expanded={isOrderOpen} className="chat-order-card" onClick={() => setIsOrderOpen((value) => !value)} type="button">
              <span className="chat-order-card__icon">FP</span><span><strong>{t("chatUi.orderTitle")}</strong><small>{message.textKey ? t(message.textKey) : order?.title}</small></span><ChevronDown className={isOrderOpen ? "is-open" : ""} size={17} />
              {isOrderOpen ? <span className="chat-order-card__details"><span><small>{t("chatUi.order.number")}</small><strong>#{order?.id ?? 10482}</strong></span><span><small>{t("chatUi.order.game")}</small><strong>{order?.game || "Valorant"}</strong></span><span><small>{t("chatUi.order.status")}</small><strong>{t("chatUi.order.inProgress")}</strong></span></span> : null}
            </button>
          ) : <span className="chat-message__text">{renderChatText(message.textKey ? t(message.textKey) : message.text)}</span>}
          <MessageTime message={message} t={t} />
        </div>
      )}
    </div>
  );
}

function VoiceMessagePlayer({ message, t }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(Math.max(0, (message.duration ?? 0) / 1000));
  const progress = duration ? Math.min(currentTime / duration, 1) : 0;

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (audio.paused) {
      void audio.play().then(() => setIsPlaying(true)).catch(() => undefined);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }

  function seek(event) {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    const nextTime = Number(event.target.value);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  return (
    <div className="chat-voice-message">
      <button className="chat-voice-message__play" onClick={togglePlayback} type="button" aria-label={t(isPlaying ? "music.pause" : "music.resume")}>{isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}</button>
      <div className="chat-voice-message__body">
        <span className="chat-voice-message__wave" aria-hidden="true">
          {voiceWaveform.map((height, index) => <i className={index / voiceWaveform.length <= progress ? "is-played" : ""} key={index} style={{ height: `${Math.round(7 + height * 17)}px` }} />)}
        </span>
        <input aria-label={t("music.seek")} max={Math.max(duration, 0.01)} min="0" onChange={seek} step="0.01" type="range" value={Math.min(currentTime, Math.max(duration, 0.01))} />
        <time>{formatRecordingDuration((isPlaying ? currentTime : duration) * 1000)}</time>
      </div>
      <audio ref={audioRef} onDurationChange={(event) => { if (Number.isFinite(event.currentTarget.duration)) setDuration(event.currentTarget.duration); }} onEnded={() => { setIsPlaying(false); setCurrentTime(0); }} onPause={() => setIsPlaying(false)} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} preload="metadata" src={message.asset} />
    </div>
  );
}

function VideoNotePlayer({ message, t }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (video.paused) {
      void video.play().then(() => setIsPlaying(true)).catch(() => undefined);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }

  return (
    <div className="chat-video-note">
      <video playsInline disablePictureInPicture preload="metadata" ref={videoRef} src={message.asset} onEnded={() => setIsPlaying(false)} onPause={() => setIsPlaying(false)} />
      <button className={isPlaying ? "is-playing" : ""} onClick={togglePlayback} type="button" aria-label={t(isPlaying ? "music.pause" : "music.resume")}>{isPlaying ? <Pause size={22} /> : <Play size={22} fill="currentColor" />}</button>
    </div>
  );
}

function renderChatText(text = "") {
  const pattern = /:([a-z0-9_-]+):/gi;
  const fragments = [];
  let cursor = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const item = siteEmojiByName.get(match[1].toLocaleLowerCase());
    if (!item) {
      continue;
    }
    if (match.index > cursor) {
      fragments.push(text.slice(cursor, match.index));
    }
    fragments.push(<img className="chat-inline-emoji" key={`${match.index}-${item.id}`} src={item.asset} alt={`:${item.name}:`} title={`:${item.name}:`} />);
    cursor = pattern.lastIndex;
  }

  if (!fragments.length) {
    return text;
  }
  if (cursor < text.length) {
    fragments.push(text.slice(cursor));
  }
  return fragments;
}

function MessageTime({ message, t }) {
  return (
    <span className="chat-message__time">
      {message.status === "sending" ? <LoaderCircle className="is-spinning" size={12} aria-label={t("chatUi.status.sending")} /> : null}
      {message.status === "error" ? <CircleAlert size={12} aria-label={t("chatUi.status.error")} /> : null}
      {message.time || formatTime(new Date(message.createdAt))}
      {message.read ? <CheckCheck size={15} aria-label={t("chatUi.status.read")} /> : message.side === "outgoing" && message.status !== "sending" && message.status !== "error" ? <Check size={13} aria-label={t("chatUi.status.sent")} /> : null}
    </span>
  );
}

function mapConversationToContact(conversation) {
  const participant = conversation.participant;
  return {
    id: `order-${conversation.orderId}`,
    orderId: conversation.orderId,
    normalizedNick: participant.normalizedNick,
    name: participant.nick,
    avatar: participant.selectedAvatarAsset || getApiAssetUrl(participant.avatarUrl),
    frame: participant.selectedFrameAsset,
    presence: participant.presence,
    time: conversation.lastMessageAt ? formatTime(new Date(conversation.lastMessageAt)) : "",
    unread: conversation.unreadCount,
    publicId: participant.publicId,
    preview: conversation.lastMessage || conversation.order.title,
    order: conversation.order
  };
}

function mapApiMessage(message, currentUserId) {
  return {
    id: message.id,
    orderId: message.orderId,
    side: message.senderId === currentUserId ? "outgoing" : "incoming",
    text: message.text,
    createdAt: message.createdAt,
    time: formatTime(new Date(message.createdAt)),
    read: Boolean(message.readAt),
    readAt: message.readAt,
    status: "sent"
  };
}

function upsertMessage(messages, nextMessage) {
  const existingIndex = messages.findIndex((message) => message.id === nextMessage.id);
  if (existingIndex < 0) {
    return [...messages, nextMessage].sort(compareMessages);
  }

  return messages.map((message, index) => index === existingIndex ? { ...message, ...nextMessage } : message);
}

function mergeMessages(older, current) {
  const byId = new Map();
  for (const message of [...older, ...current]) {
    byId.set(message.id, message);
  }
  return [...byId.values()].sort(compareMessages);
}

function compareMessages(left, right) {
  return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
}

function formatTime(date) {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatContactTime(contact, t) {
  if (contact.timeKey) {
    return t(contact.timeKey);
  }
  return contact.time;
}

function getLocalDateKey(value) {
  const date = new Date(value);
  return toDateInputValue(date);
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateKey, t) {
  const today = new Date();
  const date = new Date(`${dateKey}T12:00:00`);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (toDateInputValue(date) === toDateInputValue(today)) {
    return t("chatUi.today");
  }
  if (toDateInputValue(date) === toDateInputValue(yesterday)) {
    return t("chatUi.yesterdayLabel");
  }
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long" }).format(date);
}

export default Chat;
