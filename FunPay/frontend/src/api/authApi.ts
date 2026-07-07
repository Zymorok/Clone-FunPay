export type RegisterPayload = {
  nick: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type RegisterResponse = {
  id: number;
  nick: string;
  email: string;
  role: string;
  createdAt: string;
};

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5090";

export async function registerAccount(payload: RegisterPayload): Promise<RegisterResponse> {
  const response = await fetch(`${apiUrl}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data) ?? "Не получилось создать аккаунт.");
  }

  return data as RegisterResponse;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  if ("message" in data && typeof data.message === "string") {
    return data.message;
  }

  if ("errors" in data && data.errors && typeof data.errors === "object") {
    return Object.values(data.errors)
      .flat()
      .filter((message): message is string => typeof message === "string")
      .at(0) ?? null;
  }

  return null;
}
