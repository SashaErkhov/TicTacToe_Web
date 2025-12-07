import {BACKEND_URL} from "./config.ts";

export async function checkCookies() {
    const response = await fetch(`${BACKEND_URL}/users/me`,{
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        }
    })

    if (response.status === 401 || response.status === 403) {
        window.location.href = '/';
        return;
    }

    if (!response.ok) {
        throw new Error('Request failed');
    }

    return response.json();
}