
import { requestJson } from "./apiClient";

export async function getMyOrders(accessToken, { role = "buyer", page = 1 } = {}) {
    const params = new URLSearchParams({ role, page: String(page) });
    return requestJson(
        `/api/orders?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
        "Failed to load orders."
    );
}

export async function createOrder(accessToken, payload) {
    return requestJson(
        "/api/orders",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify(payload)
        },
        "Failed to create order."
    );
}

export async function updateOrderStatus(accessToken, orderId, status) {
    return requestJson(
        `/api/orders/${orderId}/status`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({ status })
        },
        "Failed to update order."
    );
}

export async function getOrderById(accessToken, orderId) {
    return requestJson(
        `/api/orders/${orderId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
        "Failed to load order."
    );
}