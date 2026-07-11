import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from "@microsoft/signalr";
import { apiUrl, requestJson } from "./apiClient";

export type ChatParticipant = {
  id: number;
  publicId: string;
  nick: string;
  normalizedNick: string;
  avatarUrl: string;
  selectedAvatarAsset: string;
  selectedFrameAsset: string;
  presence: "online" | "afk" | "offline";
};

export type ChatOrder = {
  id: number;
  title: string;
  game: string;
  price: number;
  status: string;
  createdAt: string;
};

export type ChatConversation = {
  orderId: number;
  participant: ChatParticipant;
  order: ChatOrder;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
};

export type ChatMessage = {
  id: number;
  orderId: number;
  senderId: number;
  text: string;
  createdAt: string;
  readAt: string | null;
};

export type ChatMessagesPage = {
  items: ChatMessage[];
  nextBeforeId: number | null;
  hasMore: boolean;
};

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json"
  };
}

export function getChatConversations(accessToken: string) {
  return requestJson<ChatConversation[]>(
    "/api/chat/conversations",
    { headers: authHeaders(accessToken) },
    "Не удалось загрузить список чатов."
  );
}

export function getChatMessages(
  accessToken: string,
  orderId: number,
  beforeId?: number | null,
  pageSize = 50
) {
  const params = new URLSearchParams({ pageSize: String(pageSize) });
  if (beforeId) {
    params.set("beforeId", String(beforeId));
  }

  return requestJson<ChatMessagesPage>(
    `/api/chat/orders/${orderId}/messages?${params}`,
    { headers: authHeaders(accessToken) },
    "Не удалось загрузить сообщения."
  );
}

export function getChatMessagesAroundDate(accessToken: string, orderId: number, date: string) {
  const utcOffsetMinutes = -new Date().getTimezoneOffset();
  return requestJson<ChatMessagesPage>(
    `/api/chat/orders/${orderId}/messages/date/${date}?utcOffsetMinutes=${utcOffsetMinutes}`,
    { headers: authHeaders(accessToken) },
    "Не удалось перейти к выбранной дате."
  );
}

export function sendChatMessage(accessToken: string, orderId: number, text: string) {
  return requestJson<ChatMessage>(
    `/api/chat/orders/${orderId}/messages`,
    {
      method: "POST",
      headers: authHeaders(accessToken),
      body: JSON.stringify({ text })
    },
    "Не удалось отправить сообщение."
  );
}

export function markChatRead(accessToken: string, orderId: number) {
  return fetch(`${apiUrl}/api/chat/orders/${orderId}/read`, {
    method: "POST",
    headers: authHeaders(accessToken)
  });
}

export function createChatConnection(
  accessToken: string,
  onMessage: (message: ChatMessage) => void,
  onRead: (payload: { orderId: number; readerId: number; readAt: string }) => void
): HubConnection {
  const connection = new HubConnectionBuilder()
    .withUrl(`${apiUrl}/hubs/chat`, { accessTokenFactory: () => accessToken })
    .withAutomaticReconnect([0, 1000, 3000, 8000])
    .configureLogging(import.meta.env.DEV ? LogLevel.Warning : LogLevel.Error)
    .build();

  connection.on("MessageCreated", onMessage);
  connection.on("MessagesRead", onRead);
  return connection;
}

export async function stopChatConnection(connection: HubConnection | null) {
  if (connection && connection.state !== HubConnectionState.Disconnected) {
    await connection.stop();
  }
}
