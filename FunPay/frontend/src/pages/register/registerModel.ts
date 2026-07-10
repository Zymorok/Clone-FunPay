export type RegisterFormState = {
  nick: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type FieldStatus = "idle" | "checking" | "available" | "taken" | "invalid";
export type PasswordStatus = "idle" | "danger" | "warning" | "success";
export type RegisterField = keyof RegisterFormState;

export const emptyRegisterForm: RegisterFormState = {
  nick: "",
  email: "",
  password: "",
  confirmPassword: ""
};

export const nickPattern = /^[a-z0-9_.-]+$/;
export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function fieldClassName(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function getAvailabilityClass(status: FieldStatus) {
  if (status === "available") {
    return "field--success";
  }

  if (status === "taken" || status === "invalid") {
    return "field--danger";
  }

  if (status === "checking") {
    return "field--warning";
  }

  return "";
}

export function getPasswordClass(status: PasswordStatus) {
  if (status === "danger") {
    return "field--danger";
  }

  if (status === "warning") {
    return "field--warning";
  }

  if (status === "success") {
    return "field--success";
  }

  return "";
}

export function getPasswordStatus(password: string): PasswordStatus {
  if (!password) {
    return "idle";
  }

  const hasLetter = /\p{L}/u.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^\p{L}0-9]/u.test(password);
  const score = [
    password.length >= 8,
    password.length >= 12,
    hasLetter && hasNumber,
    hasSymbol
  ].filter(Boolean).length;

  if (password.length < 8 || score <= 1) {
    return "danger";
  }

  if (score < 4) {
    return "warning";
  }

  return "success";
}

export function getConfirmPasswordStatus(password: string, confirmPassword: string): PasswordStatus {
  if (!confirmPassword) {
    return "idle";
  }

  if (password !== confirmPassword) {
    return "danger";
  }

  return getPasswordStatus(password);
}

export function getInvalidRegisterFields(
  form: RegisterFormState,
  nickAvailability: FieldStatus,
  emailAvailability: FieldStatus
): RegisterField[] {
  const fields: RegisterField[] = [];
  const nick = form.nick.trim().toLowerCase();
  const email = form.email.trim().toLowerCase();

  if (nick.length < 3 || !nickPattern.test(nick) || nickAvailability === "taken") {
    fields.push("nick");
  }

  if (!emailPattern.test(email) || emailAvailability === "taken") {
    fields.push("email");
  }

  if (form.password.length < 8) {
    fields.push("password");
  }

  if (!form.confirmPassword || form.password !== form.confirmPassword) {
    fields.push("confirmPassword");
  }

  return fields;
}

export function withoutSetValue<T>(current: Set<T>, value: T) {
  if (!current.has(value)) {
    return current;
  }

  const next = new Set(current);
  next.delete(value);
  return next;
}

export function includesAny(value: string, fragments: string[]) {
  return fragments.some((fragment) => value.includes(fragment));
}

export function getErrorStatus(exception: unknown) {
  return exception && typeof exception === "object" && "status" in exception && typeof exception.status === "number"
    ? exception.status
    : null;
}
