
import { requestJson } from "./apiClient";

export async function getPublicProfile(publicId) {
    return requestJson(`/api/users/${publicId}`, {}, "Failed to load profile.");
}

export async function updateMyProfile(accessToken, payload) {
    return requestJson(
        "/api/users/me",
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify(payload)
        },
        "Failed to update profile."
    );
}

export async function getUserProducts(publicId, { page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return requestJson(
        `/api/users/${publicId}/products?${params}`,
        {},
        "Failed to load user products."
    );
}

export async function adminGetUsers(accessToken, { page = 1 } = {}) {
    return requestJson(
        `/api/admin/users?page=${page}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
        "Failed to load users."
    );
}

export async function adminUpdateUserRole(accessToken, userId, role) {
    return requestJson(
        `/api/admin/users/${userId}/role`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({ role })
        },
        "Failed to update user role."
    );
}