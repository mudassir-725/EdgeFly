// client/js/authGuard.js
// EdgeFly Authentication Guard (v4.0)
// Handles routing logic between Guest & User modes with loader animations.

import { showLoader, hideLoader } from "./loader.js";

const TOKEN_KEY = "edgefly_token";
const token = localStorage.getItem(TOKEN_KEY);
const path = window.location.pathname;
const current = path.split("/").pop() || "index.html";

// 🧭 Define access rules
const PUBLIC_PAGES = [
    "index.html",
    "",
    "search_results.html",
    "get_started.html",
    "docs.html"
];

const PROTECTED_PAGES = [
    "dashboard.html",
    "wishlist.html",
    "history.html",
    "recommendations.html",
    "profile.html",
    "account.html"
];

// Helper: decode JWT payload (to check expiry)
function decodeJwtPayload(jwt) {
    try {
        const payload = jwt.split(".")[1];
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
}

// 🚦 Guard logic (delayed to allow nav transition)
if (!window.EDGEFLY_NAV_TRANSITION) {
    showLoader("Loading EdgeFly...", "circle");
}

setTimeout(() => {
    const hasToken = Boolean(token);
    const isPublic = PUBLIC_PAGES.includes(current);
    const isProtected = PROTECTED_PAGES.includes(current);

    if (isProtected && !hasToken) {
        // 🚫 Guest trying to access protected page
        showLoader("Redirecting to sign in…", "circle");
        setTimeout(() => {
            window.location.href = "../pages/get_started.html";
        }, 1800);
    }
    else if (isPublic && hasToken && (current === "index.html" || current === "get_started.html" || current === "")) {
        // 🧍‍♂️ Logged-in user visiting guest page
        showLoader("Redirecting to dashboard…", "circle");
        setTimeout(() => {
            window.location.href = "../pages/dashboard.html";
        }, 1800);
    }
    else if (hasToken) {
        // ✅ Validate token expiry
        const payload = decodeJwtPayload(token);
        if (payload?.exp && Date.now() / 1000 > payload.exp) {
            localStorage.removeItem(TOKEN_KEY);
            window.EDGEFLY_USER_EMAIL = null;
            window.EDGEFLY_USER_NAME = null;
            showLoader("Session expired — logging out…", "circle");
            setTimeout(() => {
                window.location.href = "../pages/get_started.html";
            }, 2000);
        } else {
            hideLoader();
        }
    }
    else {
        // Guest on public page → allowed
        hideLoader();
    }
}, 700);
