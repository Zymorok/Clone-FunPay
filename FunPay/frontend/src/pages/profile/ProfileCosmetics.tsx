import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { getApiAssetUrl } from "../../api/apiClient";
import {
  type CosmeticAsset,
  type CosmeticCatalog,
  type ProfileData,
  type ProfilePayload
} from "../../api/profileApi";
import { SynchronizedCosmeticVideo } from "../../components/SynchronizedCosmeticVideo";
import { getAvatarBorderColor, isAvatarBorderHidden, isAvatarBorderRainbow, isAvatarBorderRainbowSpectrum, parseAvatarBorderColor } from "../../shared/cosmetics";
import { isFuzzyMatch } from "../../data/countries";
import { useLanguage } from "../../i18n";
import { isVideoAsset } from "./profileModel";
import { Avatar } from "./ProfileAvatar";

type CosmeticCategory = "avatars" | "frames" | "banners" | "wallpapers";


export function CosmeticPicker({ cosmetics, form, hoverOnlyAnimations, onChange, profile }: { cosmetics: CosmeticCatalog; form: ProfilePayload; hoverOnlyAnimations: boolean; onChange: <Key extends keyof ProfilePayload>(key: Key, value: ProfilePayload[Key]) => void; profile: ProfileData }) {
  const { t } = useLanguage();
  const [category, setCategory] = useState<CosmeticCategory>("avatars");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);
  const [showCurrentFrame, setShowCurrentFrame] = useState(false);
  const [showCurrentAvatar, setShowCurrentAvatar] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const categories: { id: CosmeticCategory; title: string; field: "selectedAvatarAsset" | "selectedFrameAsset" | "selectedBannerAsset" | "selectedWallpaperAsset"; variant: "square" | "wide" }[] = [
    { id: "avatars", title: t("profile.page.avatar"), field: "selectedAvatarAsset", variant: "square" },
    { id: "frames", title: t("profile.page.frame"), field: "selectedFrameAsset", variant: "square" },
    { id: "banners", title: t("profile.page.banner"), field: "selectedBannerAsset", variant: "wide" },
    { id: "wallpapers", title: t("profile.page.wallpaper"), field: "selectedWallpaperAsset", variant: "wide" }
  ];
  const activeCategory = categories.find((item) => item.id === category)!;
  const items = cosmetics[category];
  const value = form[activeCategory.field] as string;
  const filteredItems = items.filter((item) => isFuzzyMatch(query, item.name));
  const visibleItems = filteredItems.slice(0, visibleCount);
  const selectedFrame = cosmetics.frames.find((item) => item.path === form.selectedFrameAsset);
  const selectedAvatar = cosmetics.avatars.find((item) => item.path === form.selectedAvatarAsset);
  const currentAvatarUrl = selectedAvatar ? "" : form.selectedAvatarAsset || getApiAssetUrl(profile.avatarUrl);
  const hasCurrentAvatar = Boolean(selectedAvatar || currentAvatarUrl);

  useEffect(() => {
    const sentinel = loadMoreRef.current;

    if (!sentinel || visibleCount >= filteredItems.length) {
      return;
    }

    const scrollRoot = sentinel.closest(".profile-editor__sheet");
    const loadNextPage = () => {
      const rootBounds = scrollRoot?.getBoundingClientRect();
      const sentinelBounds = sentinel.getBoundingClientRect();

      if (!rootBounds || sentinelBounds.top <= rootBounds.bottom + 180) {
        setVisibleCount((count) => Math.min(count + 12, filteredItems.length));
      }
    };
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        loadNextPage();
      }
    }, { root: scrollRoot, rootMargin: "180px 0px" });
    const initialCheck = requestAnimationFrame(loadNextPage);

    observer.observe(sentinel);
    scrollRoot?.addEventListener("scroll", loadNextPage, { passive: true });

    return () => {
      cancelAnimationFrame(initialCheck);
      observer.disconnect();
      scrollRoot?.removeEventListener("scroll", loadNextPage);
    };
  }, [filteredItems.length, visibleCount]);

  function selectCategory(nextCategory: CosmeticCategory) {
    setCategory(nextCategory);
    setQuery("");
    setVisibleCount(12);
  }

  return (
    <section className={`cosmetic-picker cosmetic-picker--${activeCategory.variant} cosmetic-picker--${category}`}>
      <div className="cosmetic-picker__tabs" role="tablist" aria-label={t("profile.page.appearance")}>
        {categories.map((item) => <button aria-selected={category === item.id} className="cosmetic-picker__tab" key={item.id} onClick={() => selectCategory(item.id)} role="tab" type="button">{item.title}<span>{cosmetics[item.id].length}</span></button>)}
      </div>
      <div className="cosmetic-picker__head"><strong>{activeCategory.title}</strong><div>{category === "avatars" ? <button aria-checked={showCurrentFrame} className="cosmetic-picker__frame-toggle" disabled={!selectedFrame} onClick={() => setShowCurrentFrame((current) => !current)} role="switch" type="button"><span aria-hidden="true" />{t("profile.page.myFrame")}</button> : null}{category === "frames" ? <button aria-checked={showCurrentAvatar} className="cosmetic-picker__frame-toggle" disabled={!hasCurrentAvatar} onClick={() => setShowCurrentAvatar((current) => !current)} role="switch" type="button"><span aria-hidden="true" />{t("profile.page.myAvatar")}</button> : null}<span>{items.length}</span></div></div>
      <label className="cosmetic-picker__search"><Search size={15} aria-hidden="true" /><input onChange={(event) => { setQuery(event.target.value); setVisibleCount(12); }} placeholder={t("profile.page.assetSearch")} value={query} /></label>
      <div className="cosmetic-picker__grid">
        <button className="cosmetic-picker__item cosmetic-picker__item--empty" data-selected={!value} onClick={() => onChange(activeCategory.field, "")} type="button"><span className="cosmetic-picker__label">{t("profile.page.assetNone")}</span></button>
        {visibleItems.map((item) => <button className="cosmetic-picker__item" data-selected={item.path === value} key={item.path} onClick={() => onChange(activeCategory.field, item.path)} title={item.name} type="button"><AnimatedCosmeticPreview avatar={category === "frames" && showCurrentAvatar ? selectedAvatar : undefined} avatarUrl={category === "frames" && showCurrentAvatar ? currentAvatarUrl : ""} frame={category === "avatars" && showCurrentFrame ? selectedFrame : undefined} hoverOnly={hoverOnlyAnimations} item={item} round={category === "avatars"} selected={item.path === value} /><span className="cosmetic-picker__label">{item.name}</span></button>)}
      </div>
      {filteredItems.length > visibleItems.length ? <div className="cosmetic-picker__sentinel" ref={loadMoreRef}><LoaderCircle className="profile-spin" size={18} aria-hidden="true" /></div> : null}
    </section>
  );
}

function CosmeticAssetMedia({ asset, className, shouldAnimate }: { asset: CosmeticAsset; className: string; shouldAnimate: boolean }) {
  if (shouldAnimate && isVideoAsset(asset.animatedPreviewPath)) {
    return <SynchronizedCosmeticVideo className={className} poster={asset.previewPath} source={asset.animatedPreviewPath} />;
  }

  return <img className={className} decoding="async" loading="lazy" src={shouldAnimate ? asset.animatedPreviewPath : asset.previewPath} alt="" />;
}

function AnimatedCosmeticPreview({ avatar, avatarUrl = "", item, frame, hoverOnly, round = false, selected }: { avatar?: CosmeticAsset; avatarUrl?: string; item: CosmeticAsset; frame?: CosmeticAsset; hoverOnly: boolean; round?: boolean; selected: boolean }) {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isTargeted, setIsTargeted] = useState(false);

  useEffect(() => {
    const element = rootRef.current;

    if (!element) {
      return;
    }

    const scrollRoot = element.closest(".profile-editor__sheet");
    const card = element.closest(".cosmetic-picker__item");
    const activate = () => setIsTargeted(true);
    const deactivate = () => setIsTargeted(false);
    const observer = new IntersectionObserver((entries) => {
      setIsVisible(Boolean(entries[0]?.isIntersecting));
    }, { root: scrollRoot, rootMargin: "0px", threshold: 0.1 });

    observer.observe(element);
    card?.addEventListener("pointerenter", activate);
    card?.addEventListener("pointerleave", deactivate);
    card?.addEventListener("focusin", activate);
    card?.addEventListener("focusout", deactivate);

    return () => {
      observer.disconnect();
      card?.removeEventListener("pointerenter", activate);
      card?.removeEventListener("pointerleave", deactivate);
      card?.removeEventListener("focusin", activate);
      card?.removeEventListener("focusout", deactivate);
    };
  }, []);

  const shouldAnimate = isVisible && (!hoverOnly || isTargeted || selected);
  const hasAvatar = Boolean(avatar || avatarUrl);

  return (
    <span className={`cosmetic-preview${round ? " cosmetic-preview--round" : ""}`} ref={rootRef}>
      {avatar ? <CosmeticAssetMedia asset={avatar} className="cosmetic-preview__avatar" shouldAnimate={shouldAnimate} /> : avatarUrl ? <img className="cosmetic-preview__avatar" decoding="async" loading="lazy" src={avatarUrl} alt="" /> : null}
      <CosmeticAssetMedia asset={item} className={`cosmetic-preview__asset${hasAvatar ? " cosmetic-preview__asset--frame" : ""}`} shouldAnimate={shouldAnimate} />
      {frame ? <CosmeticAssetMedia asset={frame} className="cosmetic-preview__frame" shouldAnimate={shouldAnimate} /> : null}
    </span>
  );
}

export function AvatarBorderEditor({ profile, form, onChange }: { profile: ProfileData; form: ProfilePayload; onChange: <Key extends keyof ProfilePayload>(key: Key, value: ProfilePayload[Key]) => void }) {
  const [colorInput, setColorInput] = useState(() => getAvatarBorderColor(form.avatarStyle, form.frameStyle));
  const [showAvatar, setShowAvatar] = useState(true);
  const [showFrame, setShowFrame] = useState(true);
  const currentColor = getAvatarBorderColor(form.avatarStyle, form.frameStyle);
  const parsedColor = parseAvatarBorderColor(colorInput);
  const isBorderEnabled = !isAvatarBorderHidden(form.avatarStyle);
  const isRainbowEnabled = isAvatarBorderRainbow(form.avatarStyle);
  const rainbowMode = isAvatarBorderRainbowSpectrum(form.avatarStyle) ? "spectrum" : "shift";

  useEffect(() => {
    setColorInput(getAvatarBorderColor(form.avatarStyle, form.frameStyle));
  }, [form.avatarStyle, form.frameStyle]);

  function updateColor(nextValue: string) {
    setColorInput(nextValue);
    const normalizedColor = parseAvatarBorderColor(nextValue);

    if (normalizedColor) {
      onChange("avatarStyle", normalizedColor);
    }
  }

  return (
    <details className="avatar-border-editor">
      <summary><span>Цвет обводки</span><small>Палитра и предпросмотр</small></summary>
      <div className="avatar-border-editor__content">
        <div className="avatar-border-editor__preview">
          <Avatar profile={{ ...profile, ...form }} showAvatar={showAvatar} showFrame={showFrame} />
          <div><strong>{currentColor}</strong><small>Так будет выглядеть обводка профиля.</small></div>
        </div>
        <div className="avatar-border-editor__controls">
          <label className="avatar-border-editor__enabled"><input checked={isBorderEnabled} onChange={(event) => onChange("avatarStyle", event.target.checked ? (parsedColor ?? currentColor) : `none:${parsedColor ?? currentColor}`)} type="checkbox" /> Показывать обводку</label>
          <label className="avatar-border-editor__rainbow"><input checked={isRainbowEnabled} disabled={!isBorderEnabled} onChange={(event) => onChange("avatarStyle", event.target.checked ? `rainbow:shift:${parsedColor ?? currentColor}` : (parsedColor ?? currentColor))} type="checkbox" /> Режим радуги</label>
          {isRainbowEnabled && <label className="avatar-border-editor__rainbow-mode"><span>Вариант радуги</span><select onChange={(event) => onChange("avatarStyle", `rainbow:${event.target.value}:${parsedColor ?? currentColor}`)} value={rainbowMode}><option value="shift">Перелив цвета</option><option value="spectrum">Спектр по кольцу</option></select></label>}
          <label className="avatar-border-editor__picker"><span>Палитра</span><input aria-label="Выберите цвет обводки" disabled={!isBorderEnabled || isRainbowEnabled} onChange={(event) => updateColor(event.target.value)} type="color" value={currentColor} /></label>
          <label className="avatar-border-editor__value"><span>HEX или RGB</span><input aria-invalid={Boolean(colorInput) && !parsedColor} disabled={!isBorderEnabled || isRainbowEnabled} onChange={(event) => updateColor(event.target.value)} placeholder="#E32636 или RGB: 227,38,54" value={colorInput} /><small>{isRainbowEnabled ? "Отключите режим радуги, чтобы изменить цвет." : "Поддерживаются #E32636 и RGB: 227,38,54"}</small></label>
          <div className="avatar-border-editor__visibility">
            <label><input checked={showAvatar} onChange={(event) => setShowAvatar(event.target.checked)} type="checkbox" /> Показывать аватарку</label>
            <label><input checked={showFrame} disabled={!form.selectedFrameAsset} onChange={(event) => setShowFrame(event.target.checked)} type="checkbox" /> Показывать рамку</label>
          </div>
        </div>
      </div>
    </details>
  );
}
