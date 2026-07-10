import { requestJson } from "./apiClient";

export type TeamAccount = {
  id: number;
  publicId: string;
  nick: string;
  email: string;
  role: "User" | "Admin" | "Owner";
  gender: string;
};

export async function searchTeamAccounts(accessToken: string, query: string, signal?: AbortSignal): Promise<TeamAccount[]> {
  const params = new URLSearchParams({ query });
  return requestJson<TeamAccount[]>(
    `/api/team/accounts?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, signal },
    "Не удалось найти аккаунты."
  );
}

export async function updateTeamAccountRole(
  accessToken: string,
  accountId: number,
  role: TeamAccount["role"]
): Promise<TeamAccount> {
  return requestJson<TeamAccount>(
    `/api/team/accounts/${accountId}/role`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    },
    "Не удалось обновить роль."
  );
}
