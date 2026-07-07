import { FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { registerAccount } from "../api/authApi";
import { MarketPreview } from "../components/MarketPreview";

type FormState = {
  nick: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const emptyForm: FormState = {
  nick: "",
  email: "",
  password: "",
  confirmPassword: ""
};

export function Register() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (form.password !== form.confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await registerAccount(form);
      setMessage(`Аккаунт ${user.nick} создан.`);
      setForm({ ...emptyForm, nick: user.nick, email: user.email });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Не получилось создать аккаунт.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <main className="mx-auto grid max-w-[1260px] gap-5 px-4 py-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr]">
      <section className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-6">
        <div className="mb-4">
          <h1 className="text-[28px] font-extrabold leading-tight tracking-normal text-[var(--text)] sm:text-[30px]">
            Создать аккаунт
          </h1>
          <p className="mt-2 max-w-md text-sm leading-5 text-[var(--muted)]">
            Присоединяйтесь к FunPay и начинайте покупать и продавать игровые товары.
          </p>
        </div>

        <form className="flex flex-1 flex-col gap-3" onSubmit={handleSubmit}>
          <label className="grid gap-1.5">
            <span className="text-[13px] font-extrabold text-[var(--text)]">Ник</span>
            <span className="relative block">
              <User
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                size={18}
                aria-hidden="true"
              />
              <input
                autoComplete="username"
                className="field"
                maxLength={32}
                minLength={3}
                onChange={(event) => updateField("nick", event.target.value)}
                placeholder="Введите ваш ник"
                required
                value={form.nick}
              />
            </span>
          </label>

          <label className="grid gap-1.5">
            <span className="text-[13px] font-extrabold text-[var(--text)]">Email</span>
            <span className="relative block">
              <Mail
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                size={18}
                aria-hidden="true"
              />
              <input
                autoComplete="email"
                className="field"
                maxLength={254}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="Введите email"
                required
                type="email"
                value={form.email}
              />
            </span>
          </label>

          <label className="grid gap-1.5">
            <span className="text-[13px] font-extrabold text-[var(--text)]">Пароль</span>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                size={18}
                aria-hidden="true"
              />
              <input
                autoComplete="new-password"
                className="field pr-12"
                maxLength={100}
                minLength={8}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Минимум 8 символов"
                required
                type={isPasswordVisible ? "text" : "password"}
                value={form.password}
              />
              <button
                aria-label={isPasswordVisible ? "Скрыть пароль" : "Показать пароль"}
                className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface-strong)] hover:text-[var(--text)]"
                onClick={() => setIsPasswordVisible((current) => !current)}
                type="button"
              >
                {isPasswordVisible ? (
                  <EyeOff size={18} aria-hidden="true" />
                ) : (
                  <Eye size={18} aria-hidden="true" />
                )}
              </button>
            </div>
          </label>

          <label className="grid gap-1.5">
            <span className="text-[13px] font-extrabold text-[var(--text)]">Подтвердите пароль</span>
            <span className="relative block">
              <Lock
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                size={18}
                aria-hidden="true"
              />
              <input
                autoComplete="new-password"
                className="field pr-12"
                maxLength={100}
                minLength={8}
                onChange={(event) => updateField("confirmPassword", event.target.value)}
                placeholder="Повторите пароль"
                required
                type={isPasswordVisible ? "text" : "password"}
                value={form.confirmPassword}
              />
              <button
                aria-label={isPasswordVisible ? "Скрыть подтверждение пароля" : "Показать подтверждение пароля"}
                className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--surface-strong)] hover:text-[var(--text)]"
                onClick={() => setIsPasswordVisible((current) => !current)}
                type="button"
              >
                {isPasswordVisible ? (
                  <EyeOff size={18} aria-hidden="true" />
                ) : (
                  <Eye size={18} aria-hidden="true" />
                )}
              </button>
            </span>
          </label>

          {error ? (
            <p className="rounded-lg border border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="rounded-lg border border-[color-mix(in_srgb,var(--success)_45%,transparent)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)] px-4 py-3 text-sm font-medium text-[var(--success)]">
              {message}
            </p>
          ) : null}

          <button
            className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 text-sm font-extrabold text-[var(--accent-text)] shadow-sm transition hover:bg-[var(--accent-strong)] disabled:opacity-65"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : null}
            Создать аккаунт
          </button>

          <p className="px-6 text-center text-[11px] leading-5 text-[var(--muted)]">
            Регистрируясь, вы соглашаетесь с нашими{" "}
            <a className="font-semibold text-[var(--link)] underline underline-offset-2" href="#terms">
              Условиями использования
            </a>{" "}
            и{" "}
            <a className="font-semibold text-[var(--link)] underline underline-offset-2" href="#privacy">
              Политикой конфиденциальности
            </a>
            .
          </p>

          <div className="-mx-5 mt-auto border-t border-[var(--border)] pt-4 text-center sm:-mx-6">
            <a
              className="inline-flex items-center gap-3 text-sm font-semibold text-[var(--link)] transition hover:text-[var(--accent-strong)]"
              href="#login"
            >
              <span className="text-[var(--text)]">Уже есть аккаунт?</span>
              Войти
              <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
        </form>
      </section>

      <MarketPreview />
    </main>
  );
}
