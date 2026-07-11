import { Check, Clock3, Film, Search, Send, Smile, SmilePlus, Sticker, X } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { emojiItems, emojiSets, stickerItems, stickerSets } from "./chatData";

const STANDARD_EMOJI_PAGE_SIZE = 240;
const subdivisionFlagCodes = {
  flag_england: "gb-eng",
  flag_scotland: "gb-sct",
  flag_wales: "gb-wls"
};

const tabs = [
  { id: "emoji", icon: SmilePlus, labelKey: "chatUi.media.emoji" },
  { id: "sticker", icon: Sticker, labelKey: "chatUi.media.stickers" },
  { id: "gif", icon: Film, labelKey: "chatUi.media.gif" }
];

function readRecentEmoji(profileKey) {
  try {
    const value = JSON.parse(localStorage.getItem(`funpay-chat-recent-emoji:v1:${profileKey}`) ?? "[]");
    return Array.isArray(value) ? value.slice(0, 36) : [];
  } catch {
    return [];
  }
}

function getFlagCode(item) {
  if (subdivisionFlagCodes[item.slug]) {
    return subdivisionFlagCodes[item.slug];
  }

  const regionalIndicators = [...item.emoji].map((character) => character.codePointAt(0));
  if (regionalIndicators.length !== 2 || regionalIndicators.some((codePoint) => codePoint < 0x1f1e6 || codePoint > 0x1f1ff)) {
    return null;
  }

  return regionalIndicators.map((codePoint) => String.fromCharCode(97 + codePoint - 0x1f1e6)).join("");
}

function StandardEmoji({ item }) {
  const flagCode = getFlagCode(item);
  return flagCode
    ? <span className={`chat-media-picker__flag fi fi-${flagCode}`} aria-hidden="true" />
    : <span aria-hidden="true">{item.emoji}</span>;
}

export function ChatMediaPicker({ autoSendEmoji, isOpen, onAutoSendChange, onClose, onSelect, profileKey, t }) {
  const [activeTab, setActiveTab] = useState("emoji");
  const [activeSet, setActiveSet] = useState("01");
  const [emojiSource, setEmojiSource] = useState("standard");
  const [query, setQuery] = useState("");
  const [standardGroups, setStandardGroups] = useState([]);
  const [standardEmojiLimit, setStandardEmojiLimit] = useState(STANDARD_EMOJI_PAGE_SIZE);
  const [recentEmoji, setRecentEmoji] = useState(() => readRecentEmoji(profileKey));
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setRecentEmoji(readRecentEmoji(profileKey));
  }, [profileKey]);

  useEffect(() => {
    if (!isOpen || activeTab !== "emoji" || emojiSource !== "standard" || standardGroups.length) {
      return undefined;
    }

    let cancelled = false;
    void import("unicode-emoji-json/data-by-group.json").then((module) => {
      if (!cancelled) {
        setStandardGroups(module.default ?? module);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeTab, emojiSource, isOpen, standardGroups.length]);

  const normalizedQuery = deferredQuery.trim().toLocaleLowerCase();
  const standardEmojiGroups = useMemo(() => {
    return standardGroups.flatMap((group) => {
      const emojis = group.emojis
        .filter((item) => !normalizedQuery || item.name.toLocaleLowerCase().includes(normalizedQuery) || item.emoji.includes(normalizedQuery))
        .map((item) => ({ ...item, id: `unicode-${item.slug}`, kind: "emoji", source: "standard" }));
      return emojis.length ? [{ ...group, emojis }] : [];
    });
  }, [normalizedQuery, standardGroups]);

  const standardEmojiCount = useMemo(
    () => standardEmojiGroups.reduce((total, group) => total + group.emojis.length, 0),
    [standardEmojiGroups]
  );

  const visibleStandardEmojiGroups = useMemo(() => {
    let remaining = standardEmojiLimit;
    return standardEmojiGroups.flatMap((group) => {
      if (remaining <= 0) {
        return [];
      }
      const emojis = group.emojis.slice(0, remaining);
      remaining -= emojis.length;
      return emojis.length ? [{ ...group, emojis }] : [];
    });
  }, [standardEmojiGroups, standardEmojiLimit]);

  useEffect(() => {
    setStandardEmojiLimit(STANDARD_EMOJI_PAGE_SIZE);
  }, [deferredQuery, emojiSource, isOpen]);

  const visibleItems = useMemo(() => {
    let source;
    if (activeTab === "sticker") {
      source = stickerItems.filter((item) => item.set === activeSet);
    } else if (emojiSource === "recent") {
      source = recentEmoji;
    } else {
      source = emojiItems.filter((item) => item.set === activeSet);
    }
    return normalizedQuery ? source.filter((item) => item.name.toLocaleLowerCase().includes(normalizedQuery)) : source;
  }, [activeSet, activeTab, emojiSource, normalizedQuery, recentEmoji]);

  function selectItem(item) {
    const selected = { ...item, kind: activeTab };
    if (activeTab === "emoji") {
      const nextRecent = [selected, ...recentEmoji.filter((current) => current.id !== selected.id)].slice(0, 36);
      setRecentEmoji(nextRecent);
      localStorage.setItem(`funpay-chat-recent-emoji:v1:${profileKey}`, JSON.stringify(nextRecent));
    }
    onSelect(selected);
  }

  function selectEmojiSource(source, set = activeSet) {
    setActiveTab("emoji");
    setEmojiSource(source);
    setActiveSet(set);
    setQuery("");
  }

  function loadMoreStandardEmoji(event) {
    const element = event.currentTarget;
    if (element.scrollHeight - element.scrollTop - element.clientHeight > 260) {
      return;
    }
    setStandardEmojiLimit((current) => Math.min(standardEmojiCount, current + STANDARD_EMOJI_PAGE_SIZE));
  }

  return (
    <section className="chat-media-picker" data-state={isOpen ? "open" : "closed"} inert={!isOpen} aria-label={t("chatUi.media.title")}>
      <header className="chat-media-picker__tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button className={activeTab === tab.id ? "is-active" : ""} key={tab.id} onClick={() => setActiveTab(tab.id)} type="button">
              <Icon size={17} />{t(tab.labelKey)}
            </button>
          );
        })}
        <button className="chat-media-picker__close" onClick={onClose} type="button" aria-label={t("profile.page.close")}><X size={18} /></button>
      </header>

      {activeTab !== "gif" ? (
        <>
          <label className="chat-media-picker__search">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("chatUi.media.search")} />
          </label>

          {activeTab === "emoji" && emojiSource === "standard" ? (
            <div className="chat-media-picker__standard-scroll" onScroll={loadMoreStandardEmoji}>
              {standardGroups.length ? visibleStandardEmojiGroups.map((group) => (
                <section className="chat-media-picker__emoji-group" key={group.slug}>
                  <h3>{t(`chatEmoji.groups.${group.slug}`)}</h3>
                  <div className="chat-media-picker__grid chat-media-picker__grid--unicode">
                    {group.emojis.map((item) => <button key={item.id} onClick={() => selectItem(item)} title={item.name} type="button" aria-label={item.name}><StandardEmoji item={item} /></button>)}
                  </div>
                </section>
              )) : <div className="chat-media-picker__loading">{t("chatEmoji.loading")}</div>}
              {standardGroups.length && !standardEmojiCount ? <div className="chat-media-picker__loading">{t("chatEmoji.notFound")}</div> : null}
              {standardEmojiLimit < standardEmojiCount ? <div className="chat-media-picker__loading chat-media-picker__loading--more">{t("chatEmoji.loading")}</div> : null}
            </div>
          ) : (
            <>
              <div className="chat-media-picker__heading">
                <strong>{activeTab === "sticker" ? stickerSets.find((set) => set.id === activeSet)?.name : emojiSource === "recent" ? t("chatEmoji.recent") : emojiSets.find((set) => set.id === activeSet)?.name}</strong>
                <span>{visibleItems.length}</span>
              </div>
              <div className={`chat-media-picker__grid chat-media-picker__grid--${activeTab}`}>
                {visibleItems.map((item) => (
                  <button key={item.id} onClick={() => selectItem(item)} title={item.name} type="button" aria-label={item.name}>
                    {item.emoji ? <span className="chat-media-picker__unicode">{item.emoji}</span> : <img src={item.asset} alt="" loading="lazy" />}
                  </button>
                ))}
                {!visibleItems.length ? <span className="chat-media-picker__no-results">{t("chatEmoji.notFound")}</span> : null}
              </div>
            </>
          )}

          {activeTab === "emoji" ? (
            <footer className="chat-media-picker__sets chat-media-picker__sets--emoji">
              <button className={emojiSource === "recent" ? "is-active" : ""} onClick={() => selectEmojiSource("recent")} type="button" aria-label={t("chatEmoji.recent")}><Clock3 size={20} /></button>
              <button className={emojiSource === "standard" ? "is-active" : ""} onClick={() => selectEmojiSource("standard")} type="button" aria-label={t("chatEmoji.standard")}><Smile size={21} /></button>
              {emojiSets.map((set) => <button className={emojiSource === "custom" && activeSet === set.id ? "is-active" : ""} key={set.id} onClick={() => selectEmojiSource("custom", set.id)} type="button" aria-label={set.name}><img src={set.cover} alt="" /></button>)}
              <label className="chat-media-picker__auto-send" title={t("chatEmoji.autoSendHint")}>
                <input aria-label={t("chatEmoji.autoSendHint")} checked={autoSendEmoji} onChange={(event) => onAutoSendChange(event.target.checked)} type="checkbox" />
                <span><Check size={10} /></span><Send size={13} />
              </label>
            </footer>
          ) : null}

          {activeTab === "sticker" ? (
            <footer className="chat-media-picker__sets">
              {stickerSets.map((set) => (
                <button className={activeSet === set.id ? "is-active" : ""} key={set.id} onClick={() => setActiveSet(set.id)} type="button" aria-label={set.name}>
                  <img src={set.cover} alt="" />
                </button>
              ))}
            </footer>
          ) : null}
        </>
      ) : (
        <div className="chat-media-picker__empty">
          <Film size={34} />
          <strong>{t("chatUi.media.noGif")}</strong>
          <span>{t("chatUi.media.noGifHint")}</span>
        </div>
      )}
    </section>
  );
}
