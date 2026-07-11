import { Bell, BellRing } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n";

export function NotificationMenu() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  return (
    <div
      className="notification-menu"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      }}
      ref={rootRef}
    >
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={t("notifications.open")}
        className="notification-menu__trigger nav-ring-link"
        onClick={() => setIsOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <Bell size={18} aria-hidden="true" />
      </button>

      <div
        aria-hidden={!isOpen}
        className="notification-menu__dropdown"
        data-state={isOpen ? "open" : "closed"}
        inert={!isOpen}
        role="menu"
      >
        <div className="notification-menu__heading">
          <strong>{t("notifications.title")}</strong>
          <small>{t("notifications.allRead")}</small>
        </div>
        <div className="notification-menu__empty">
          <span><BellRing size={20} aria-hidden="true" /></span>
          <strong>{t("notifications.emptyTitle")}</strong>
          <small>{t("notifications.emptyText")}</small>
        </div>
      </div>
    </div>
  );
}
