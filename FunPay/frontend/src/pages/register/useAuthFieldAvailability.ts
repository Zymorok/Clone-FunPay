import { useEffect, useState } from "react";
import { checkAuthFieldAvailability, type AvailabilityField } from "../../api/authApi";
import { emailPattern, nickPattern, type FieldStatus } from "./registerModel";

const availabilityDelayMs = 650;

export function useAuthFieldAvailability(
  field: AvailabilityField,
  value: string,
  formError: string | null
) {
  const [status, setStatus] = useState<FieldStatus>("idle");

  useEffect(() => {
    const normalizedValue = value.trim().toLowerCase();

    if (formError) {
      return;
    }

    if (!normalizedValue) {
      setStatus("idle");
      return;
    }

    const isValid = field === "nick"
      ? normalizedValue.length >= 3 && nickPattern.test(normalizedValue)
      : emailPattern.test(normalizedValue);

    if (!isValid) {
      setStatus("invalid");
      return;
    }

    let controller: AbortController | null = null;
    const timeoutId = window.setTimeout(() => {
      controller = new AbortController();
      setStatus("checking");

      checkAuthFieldAvailability(field, normalizedValue, controller.signal)
        .then((result) => setStatus(result.available ? "available" : "taken"))
        .catch(() => {
          if (!controller?.signal.aborted) {
            setStatus("idle");
          }
        });
    }, availabilityDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
      controller?.abort();
    };
  }, [field, formError, value]);

  return [status, setStatus] as const;
}
