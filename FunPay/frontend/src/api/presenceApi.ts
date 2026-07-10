import { requestJson } from "./apiClient";

export type PresenceStatus = "online" | "afk" | "offline";

export type PresenceData = {
  status: PresenceStatus;
};

export async function sendPresenceHeartbeat(accessToken: string, isActive: boolean): Promise<PresenceData> {
  return requestJson<PresenceData>(
    "/api/presence/heartbeat",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ isActive })
    },
    "Не удалось обновить статус присутствия."
  );
}

export async function getPresenceByNormalizedNick(
  normalizedNick: string,
  signal?: AbortSignal
): Promise<PresenceData> {
  return requestJson<PresenceData>(
    `/api/presence/${encodeURIComponent(normalizedNick)}`,
    { signal },
    "Не удалось обновить статус присутствия."
  );
}
