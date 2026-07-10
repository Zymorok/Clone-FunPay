import { useRef, useState, type FormEvent } from "react";
import { useAuth } from "../../auth/AuthContext";
import { requestBrowserPasswordSave } from "../../auth/browserCredentials";
import { useLanguage } from "../../i18n";
import {
  emptyRegisterForm,
  getConfirmPasswordStatus,
  getErrorStatus,
  getInvalidRegisterFields,
  getPasswordStatus,
  includesAny,
  type RegisterField,
  type RegisterFormState,
  withoutSetValue
} from "./registerModel";
import { useAuthFieldAvailability } from "./useAuthFieldAvailability";

export function useRegisterForm() {
  const { t } = useLanguage();
  const { register } = useAuth();
  const [form, setForm] = useState<RegisterFormState>(emptyRegisterForm);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidFields, setInvalidFields] = useState<Set<RegisterField>>(() => new Set());
  const [shakingFields, setShakingFields] = useState<Set<RegisterField>>(() => new Set());
  const formRef = useRef<HTMLFormElement | null>(null);
  const [nickAvailability, setNickAvailability] = useAuthFieldAvailability("nick", form.nick, error);
  const [emailAvailability, setEmailAvailability] = useAuthFieldAvailability("email", form.email, error);
  const passwordStatus = getPasswordStatus(form.password);
  const confirmPasswordStatus = getConfirmPasswordStatus(form.password, form.confirmPassword);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const fieldsWithErrors = getInvalidRegisterFields(form, nickAvailability, emailAvailability);

    if (fieldsWithErrors.length > 0) {
      markInvalidFields(fieldsWithErrors);
      setError(
        fieldsWithErrors.includes("confirmPassword") && form.password !== form.confirmPassword
          ? t("register.passwordMismatch")
          : t("register.checkFields")
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await register(form, { persist: remember });
      requestBrowserPasswordSave(formRef.current, remember);
    } catch (exception) {
      const errorMessage = exception instanceof Error ? exception.message : t("register.createFailed");
      setError(errorMessage);
      markServerFieldError(errorMessage, getErrorStatus(exception));
    } finally {
      setIsSubmitting(false);
    }
  }

  function markInvalidFields(fields: RegisterField[]) {
    const nextFields = new Set(fields);
    setInvalidFields(nextFields);
    setShakingFields(nextFields);
  }

  function markServerFieldError(errorMessage: string, status: number | null) {
    const normalizedError = errorMessage.toLowerCase();
    const fields: RegisterField[] = [];

    if (includesAny(normalizedError, ["ник", "нік", "nick"])) {
      fields.push("nick");
    }

    if (includesAny(normalizedError, ["почт", "пошт", "email"])) {
      fields.push("email");
    }

    if (includesAny(normalizedError, ["парол", "password"])) {
      fields.push(normalizedError.includes("совпад") || normalizedError.includes("збіг") ? "confirmPassword" : "password");
    }

    if (fields.length === 0 && status === 409) {
      fields.push("nick", "email");
    }

    if (fields.length > 0) {
      markInvalidFields(fields);
    }

    if (fields.includes("nick") && includesAny(normalizedError, ["занят", "зайнят", "taken", "exist"])) {
      setNickAvailability("taken");
    }

    if (fields.includes("email") && includesAny(normalizedError, ["занят", "зайнят", "taken", "exist"])) {
      setEmailAvailability("taken");
    }
  }

  function updateField(field: RegisterField, value: string) {
    setError(null);
    setInvalidFields((current) => withoutSetValue(current, field));
    setShakingFields((current) => withoutSetValue(current, field));

    if (field === "nick") {
      setNickAvailability("idle");
    }

    if (field === "email") {
      setEmailAvailability("idle");
    }

    setForm((current) => ({ ...current, [field]: value }));
  }

  function finishFieldShake(field: RegisterField) {
    setShakingFields((current) => withoutSetValue(current, field));
  }

  return {
    confirmPasswordStatus,
    emailAvailability,
    error,
    finishFieldShake,
    form,
    formRef,
    handleSubmit,
    invalidFields,
    isPasswordVisible,
    isSubmitting,
    nickAvailability,
    passwordStatus,
    remember,
    setIsPasswordVisible,
    setRemember,
    shakingFields,
    updateField
  };
}
