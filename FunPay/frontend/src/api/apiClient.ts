export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5090";

export function getApiAssetUrl(path: string) {
  return path ? `${apiUrl}${path}` : "";
}

export async function requestJson<T>(
  path: string,
  init: RequestInit,
  fallbackMessage: string
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${apiUrl}${path}`, init);
  } catch {
    throw new ApiError("Backend недоступен. Проверьте, что сервер запущен.", 0);
  }

  const data = await readJson(response);

  if (!response.ok) {
    throw new ApiError(getErrorMessage(data) ?? fallbackMessage, response.status);
  }

  return data as T;
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
