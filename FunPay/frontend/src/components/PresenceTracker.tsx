import { useEffect, useRef } from "react";
import { sendPresenceHeartbeat } from "../api/presenceApi";
import { useAuth } from "../auth/AuthContext";

const heartbeatIntervalMs = 20_000;
const afkAfterMs = 5 * 60_000;
const activityEvents = ["pointerdown", "keydown", "mousemove", "scroll", "touchstart"] as const;

export function PresenceTracker() {
  const { accessToken } = useAuth();
  const lastActivityRef = useRef(Date.now());
  const heartbeatInFlightRef = useRef(false);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const sendHeartbeat = async () => {
      if (heartbeatInFlightRef.current) {
        return;
      }

      heartbeatInFlightRef.current = true;
      const isActive = !document.hidden && Date.now() - lastActivityRef.current < afkAfterMs;

      try {
        await sendPresenceHeartbeat(accessToken, isActive);
      } catch {
        // NOTE: Потеря одного сигнала активности не должна мешать пользователю работать с сайтом.
      } finally {
        heartbeatInFlightRef.current = false;
      }
    };

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, markActivity, { passive: true });
    }

    window.addEventListener("focus", markActivity);
    document.addEventListener("visibilitychange", sendHeartbeat);

    void sendHeartbeat();
    const intervalId = window.setInterval(() => void sendHeartbeat(), heartbeatIntervalMs);

    return () => {
      window.clearInterval(intervalId);
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, markActivity);
      }
      window.removeEventListener("focus", markActivity);
      document.removeEventListener("visibilitychange", sendHeartbeat);
    };
  }, [accessToken]);

  return null;
}
