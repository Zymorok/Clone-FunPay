import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronDown, LogOut, MessageCircle, Settings2, ShieldCheck, UserCircle } from "lucide-react";
import { getApiAssetUrl } from "../api/apiClient";
import type { AuthUser } from "../api/authApi";
import type { Theme } from "../app/theme";
import { useAuth } from "../auth/AuthContext";
import { useLanguage } from "../i18n";
import { isAvatarBorderHidden, isAvatarBorderRainbow, isAvatarBorderRainbowSpectrum, parseAvatarBorderColor } from "../shared/cosmetics";
import { AccountSettingsDialog } from "./AccountSettingsDialog";
import { EmailPrivacyToggle } from "./EmailPrivacyToggle";
import { TeamManagementDialog } from "./TeamManagementDialog";

const menuItems = [
  { href: "/profile", icon: UserCircle, labelKey: "userMenu.profile", tone: "profile" },
  { href: "/chat", icon: MessageCircle, labelKey: "userMenu.chat", tone: "chat" }
] as const;

type UserMenuProps = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
};

export function UserMenu({ theme, onThemeChange }: UserMenuProps) {
  const { t } = useLanguage();
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  function closeMenu(restoreTriggerFocus = true) {
    const focusedElement = document.activeElement;

    if (focusedElement instanceof HTMLElement && rootRef.current?.contains(focusedElement)) {
      if (restoreTriggerFocus) {
        triggerRef.current?.focus();
      } else {
        focusedElement.blur();
      }
    }

    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const canManageTeam = user.canManageTeam;
  const roleTitle = user.role === "Owner"
    ? t(user.gender === "female" ? "profile.page.ownerFemale" : "profile.page.owner")
    : user.role === "Admin"
      ? t(user.gender === "female" ? "profile.page.administratorFemale" : "profile.page.administrator")
      : t("userMenu.roleUser");

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    await logout("/login");
  }

  return (
    <div
      className="user-menu"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeMenu();
        }
      }}
      ref={rootRef}
    >
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={t("userMenu.open")}
        className="user-menu__trigger nav-ring-link"
        onClick={() => isOpen ? closeMenu() : setIsOpen(true)}
        ref={triggerRef}
        type="button"
      >
        <MenuAvatar size="small" user={user} />
        <span className="user-menu__trigger-copy">
          <strong>{user.nick}</strong>
          <small>{roleTitle}</small>
        </span>
        <ChevronDown className="user-menu__chevron" size={16} aria-hidden="true" />
      </button>

      <div
        aria-hidden={!isOpen}
        className="user-menu__dropdown"
        data-state={isOpen ? "open" : "closed"}
        inert={!isOpen}
        role="menu"
      >
        <div className="user-menu__head">
          <a
            aria-label={t("userMenu.profile")}
            className="user-menu__head-link"
            href="/profile"
            onClick={() => closeMenu()}
            role="menuitem"
          />
          <MenuAvatar user={user} />
          <span className="user-menu__head-copy">
            <strong>{user.nick}</strong>
            <EmailPrivacyToggle className="user-menu__email" email={user.email} />
          </span>
        </div>

        <div className="user-menu__grid">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <a
                className={`user-menu__link user-menu__link--${item.tone}`}
                href={item.href}
                key={item.href}
                onClick={() => closeMenu()}
                role="menuitem"
              >
                <Icon size={17} aria-hidden="true" />
                <span>{t(item.labelKey)}</span>
              </a>
            );
          })}
        </div>

        {canManageTeam ? (
          <button
            className="user-menu__team"
            onClick={() => {
              closeMenu(false);
              setIsTeamManagerOpen(true);
            }}
            role="menuitem"
            type="button"
          >
            <ShieldCheck size={18} aria-hidden="true" />
            <span>
              <strong>{t("teamManagement.menuTitle")}</strong>
              <small>{t("teamManagement.menuHint")}</small>
            </span>
          </button>
        ) : null}

        <button
          className="user-menu__settings"
          onClick={() => {
            closeMenu(false);
            setIsSettingsOpen(true);
          }}
          role="menuitem"
          type="button"
        >
          <Settings2 size={18} aria-hidden="true" />
          <span>
            <strong>{t("userMenu.settings")}</strong>
            <small>{t("userMenu.settingsHint")}</small>
          </span>
        </button>

        <button className="user-menu__logout" disabled={isLoggingOut} onClick={handleLogout} role="menuitem" type="button">
          <LogOut size={17} aria-hidden="true" />
          <span>{isLoggingOut ? t("userMenu.signingOut") : t("userMenu.logout")}</span>
          <small>{t("userMenu.logoutHint")}</small>
        </button>
      </div>
      {isSettingsOpen ? (
        <AccountSettingsDialog
          onClose={() => setIsSettingsOpen(false)}
          onThemeChange={onThemeChange}
          theme={theme}
        />
      ) : null}
      {isTeamManagerOpen ? <TeamManagementDialog onClose={() => setIsTeamManagerOpen(false)} /> : null}
    </div>
  );
}

function MenuAvatar({ user, size = "normal" }: { user: AuthUser; size?: "normal" | "small" }) {
  const avatarText = user.nick.slice(0, 2).toUpperCase();
  const avatarUrl = user.selectedAvatarAsset || getApiAssetUrl(user.avatarUrl ?? "");
  const frameUrl = user.selectedFrameAsset;
  const avatarBorderColor = parseAvatarBorderColor(user.avatarStyle);

  return (
    <span className={`user-avatar${size === "small" ? " user-avatar--sm" : ""}${isAvatarBorderHidden(user.avatarStyle) ? " user-avatar--border-hidden" : ""}${isAvatarBorderRainbow(user.avatarStyle) ? " user-avatar--rainbow" : ""}${isAvatarBorderRainbowSpectrum(user.avatarStyle) ? " user-avatar--rainbow-spectrum" : ""}`} aria-hidden="true" style={avatarBorderColor ? { borderColor: avatarBorderColor } as CSSProperties : undefined}>
      {avatarUrl ? <img className="user-avatar__image" src={avatarUrl} alt="" /> : avatarText}
      {frameUrl ? <img className="user-avatar__frame" src={frameUrl} alt="" /> : null}
    </span>
  );
}
