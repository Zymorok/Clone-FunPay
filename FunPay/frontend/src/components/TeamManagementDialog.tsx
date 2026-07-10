import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Crown, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { ApiError } from "../api/apiClient";
import { searchTeamAccounts, type TeamAccount, updateTeamAccountRole } from "../api/teamApi";
import { useAuth } from "../auth/AuthContext";
import { useLanguage } from "../i18n";
import { useAnimatedDialog } from "./useAnimatedDialog";

type TeamRole = TeamAccount["role"];

export function TeamManagementDialog({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const { accessToken, updateCurrentUser, user } = useAuth();
  const [query, setQuery] = useState("");
  const [accounts, setAccounts] = useState<TeamAccount[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savingAccountId, setSavingAccountId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { isClosing, requestClose } = useAnimatedDialog(onClose);

  const ownAccount = useMemo<TeamAccount | null>(() => user ? {
    id: user.id,
    publicId: user.publicId,
    nick: user.nick,
    email: user.email,
    role: user.role as TeamRole,
    gender: user.gender
  } : null, [user]);
  const availableRoles: TeamRole[] = ["User", "Admin", "Owner"];

  useEffect(() => {
    if (!accessToken || query.trim().length === 0) {
      setAccounts([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setIsSearching(true);
      setMessage(null);
      void searchTeamAccounts(accessToken, query, controller.signal)
        .then(setAccounts)
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }

          setAccounts([]);
          setMessage(error instanceof ApiError ? error.message : "Не удалось выполнить поиск.");
        })
        .finally(() => setIsSearching(false));
    }, 240);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [accessToken, query]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [requestClose]);

  if (!user || !accessToken) {
    return null;
  }

  const displayedAccounts = query.trim().length === 0 ? (ownAccount ? [ownAccount] : []) : accounts;

  async function changeRole(account: TeamAccount, role: TeamRole) {
    if (!accessToken || !user || account.role === role || savingAccountId !== null) {
      return;
    }

    setSavingAccountId(account.id);
    setMessage(null);

    try {
      const updated = await updateTeamAccountRole(accessToken, account.id, role);
      setAccounts((current) => current.map((item) => item.id === updated.id ? updated : item));

      if (updated.id === user.id) {
        updateCurrentUser({ ...user, role: updated.role });
      }

      setMessage(`Роль «${getRoleLabel(updated.role, updated.gender, t)}» сохранена.`);
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Не удалось обновить роль.");
    } finally {
      setSavingAccountId(null);
    }
  }

  return createPortal(
    <div className={`team-manager${isClosing ? " modal-layer--closing" : ""}`} role="dialog" aria-modal="true" aria-label="Управление командой">
      <section className="team-manager__sheet">
        <header className="team-manager__head">
          <div>
            <span className="team-manager__kicker"><ShieldCheck size={15} aria-hidden="true" /> Команда сайта</span>
            <h2>Управление ролями</h2>
            <p>Меняйте статус своего или другого аккаунта.</p>
          </div>
          <button className="profile-icon-button" onClick={requestClose} type="button" aria-label="Закрыть">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <label className="team-manager__search">
          <span>Поиск аккаунта</span>
          <div>
            <Search size={18} aria-hidden="true" />
            <input
              autoFocus
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ник или почта"
              type="search"
              value={query}
            />
          </div>
          <small>Можно ввести любую часть ника или почты.</small>
        </label>

        <div className="team-manager__list" aria-live="polite">
          {displayedAccounts.map((account) => (
            <TeamAccountRow
              account={account}
              isSaving={savingAccountId === account.id}
              key={account.id}
              onChangeRole={changeRole}
              roles={availableRoles}
            />
          ))}
          {isSearching ? <p className="team-manager__state">Ищем аккаунты…</p> : null}
          {!isSearching && query.trim().length > 0 && displayedAccounts.length === 0 && !message ? <p className="team-manager__state">Аккаунты не найдены.</p> : null}
        </div>

        {message ? <p className="team-manager__message">{message}</p> : null}
      </section>
    </div>,
    document.body
  );
}

function TeamAccountRow({
  account,
  isSaving,
  onChangeRole,
  roles
}: {
  account: TeamAccount;
  isSaving: boolean;
  onChangeRole: (account: TeamAccount, role: TeamRole) => Promise<void>;
  roles: TeamRole[];
}) {
  const { t } = useLanguage();

  return (
    <article className="team-manager__account">
      <span className={`team-manager__avatar team-manager__avatar--${account.role.toLowerCase()}`} aria-hidden="true">
        {account.role === "Owner" ? <Crown size={19} /> : account.role === "Admin" ? <ShieldCheck size={19} /> : <UserRound size={19} />}
      </span>
      <div className="team-manager__identity">
        <strong>{account.nick}</strong>
          <small>{account.email} · ID {account.publicId}</small>
      </div>
      <div className="team-manager__roles" aria-label={`Роль ${account.nick}`}>
        {roles.map((role) => (
          <button
            className={account.role === role ? "is-active" : ""}
            disabled={isSaving || account.role === role}
            key={role}
            onClick={() => void onChangeRole(account, role)}
            type="button"
          >
            {getRoleLabel(role, account.gender, t)}
          </button>
        ))}
      </div>
    </article>
  );
}

function getRoleLabel(role: TeamRole, gender: string, t: (key: string) => string) {
  if (role === "Admin") {
    return t(gender === "female" ? "profile.page.administratorFemale" : "profile.page.administrator");
  }

  if (role === "Owner") {
    return t(gender === "female" ? "profile.page.ownerFemale" : "profile.page.owner");
  }

  return t("profile.page.member");
}
