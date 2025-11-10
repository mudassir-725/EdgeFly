// client/js/api.js
// EdgeFly — lightweight API client for frontend
// ES module with named exports + default export object
// Usage: import * as EdgeApi from './api.js' or import EdgeApi from './api.js'

// Config: can be overridden on the page with window.API_BASE
// const API_BASE = window.API_BASE || "http://localhost:5000/api";

const API_BASE = "https://edgefly-5u6r.onrender.com/api";
// const API_BASE = "https://edgefly.onrender.com/api";
const TOKEN_KEY = "edgefly_token"; // single source of truth for token key

// ---------------- Token helpers ----------------
export function setToken(token) {
    if (!token) {
        localStorage.removeItem(TOKEN_KEY);
        return;
    }
    localStorage.setItem(TOKEN_KEY, token);
}
export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}
export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

// ---------------- low-level fetch wrapper ----------------
// Normalizes responses and errors. Always returns parsed JSON on success,
// or throws a structured Error on failure.
async function apiFetch(path, options = {}, { auth = false } = {}) {
    const url = `${API_BASE}${path}`;
    const headers = options.headers ? { ...options.headers } : {};

    // Content-Type default (skip if FormData)
    if (!(options.body instanceof FormData)) {
        if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
    }

    // Auth header
    if (auth) {
        const token = getToken();
        if (!token) {
            // Return consistent error object instead of throwing raw
            return { success: false, status: 401, message: "No auth token" };
        }
        headers["Authorization"] = `Bearer ${token}`;
    }

    try {
        const resp = await fetch(url, { ...options, headers });

        // 204 No Content
        if (resp.status === 204) return { success: true };

        const text = await resp.text();
        let body = null;
        try {
            body = text ? JSON.parse(text) : null;
        } catch (err) {
            body = text;
        }

        if (!resp.ok) {
            // Normalize and return error-like object
            const message = body?.message || body?.error || body || resp.statusText;
            return { success: false, status: resp.status, message, raw: body };
        }

        // Success: return parsed body
        return body;
    } catch (err) {
        // Network-level error (CORS, DNS, offline)
        return { success: false, status: 0, message: err.message || "Network error" };
    }
}

// ---------------- Auth endpoints ----------------
export async function register({ email, password }) {
    return apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    }, { auth: false });
}

export async function login({ email, password }) {
    const result = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    }, { auth: false });

    // server should return { success: true, token, user } or similar
    if (result?.success && result.token) {
        setToken(result.token);
    }
    return result;
}

export async function logout() {
    // best-effort notify server, then clear token locally
    try {
        await apiFetch("/auth/logout", { method: "POST" }, { auth: true });
    } catch (err) { /* ignore */ }
    clearToken();
    return { success: true };
}

export async function getMe() {
    return apiFetch("/auth/me", {}, { auth: true });
}

// ---------------- Flights ----------------
export async function searchFlightsUser(params) {
    const token = localStorage.getItem("edgefly_token");
    // note: your backend route seems to be /flights, not /flights/user
    // if /flights/user exists, keep it; otherwise this will hit /api/flights as designed
    return fetch(`${API_BASE}/flights`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(params),
    }).then(async (res) => {
        const text = await res.text();
        let data;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = text;
        }

        if (!res.ok) {
            throw new Error(
                data?.message || `Amadeus API request failed (${res.status})`
            );
        }
        return data;
    });
}

export async function searchFlightsGuest(params) {
    return apiFetch("/flights/guest", { method: "POST", body: JSON.stringify(params) }, { auth: false });
}
export async function amadeusTest() {
    return apiFetch("/flights/test", { method: "GET" }, { auth: false });
}
export async function autocompleteAirport(keyword) {
    return apiFetch(`/flights/autocomplete?keyword=${encodeURIComponent(keyword)}`, { method: "GET" }, { auth: false });
}

// ---------------- EdgeAgent ----------------
// export async function askAgentUser(message, context = {}) {
//     return apiFetch("/agent/query", { method: "POST", body: JSON.stringify({ message, context }) }, { auth: true });
// }
// export async function askAgentGuest(message, context = {}) {
//     return apiFetch("/agent/guest", { method: "POST", body: JSON.stringify({ message, context }) }, { auth: false });
// }

export async function askAgentUser(message) {
    return apiFetch("/agent/query", {
        method: "POST",
        body: JSON.stringify({ message })
    }, { auth: true });
}

export async function askAgentGuest(message) {
    return apiFetch("/agent/guest", {
        method: "POST",
        body: JSON.stringify({ message })
    }, { auth: false });
}

// ---------------- Wishlist CRUD ----------------
export async function wishlistGet() {
    return apiFetch("/wishlist", { method: "GET" }, { auth: true });
}
export async function wishlistAdd(flight) {
    // return apiFetch("/wishlist", { method: "POST", body: JSON.stringify({ flight }) }, { auth: true });
    return apiFetch("/wishlist", { method: "POST", body: flight });
}

export async function wishlistDelete(id) {
    return apiFetch(`/wishlist/${encodeURIComponent(id)}`, { method: "DELETE" }, { auth: true });
}

// ---------------- Dashboard / History / Recs ----------------
export async function getSearchHistory() {
    return apiFetch("/search", { method: "GET" }, { auth: true });
}
export async function getDashboard() {
    return apiFetch("/dashboard", { method: "GET" }, { auth: true });
}
export async function getRecommendations() {
    return apiFetch("/recommendations", { method: "GET" }, { auth: true });
}

// ---------------- Utilities ----------------
export function isAuthenticated() {
    return !!getToken();
}

// default export convenience object
const defaultExport = {
    API_BASE, TOKEN_KEY,
    setToken, getToken, clearToken,
    register, login, logout, getMe,
    searchFlightsUser, searchFlightsGuest, amadeusTest, autocompleteAirport,
    askAgentUser, askAgentGuest,
    wishlistGet, wishlistDelete,
    getSearchHistory, getDashboard, getRecommendations,
    isAuthenticated
};

export default defaultExport;

