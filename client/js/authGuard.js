// client/js/authGuard.js
// EdgeFly Authentication Guard (v3.7)
// Adds circle loader transitions without overlapping navGuard

import { showLoader, hideLoader } from "./loader.js";

const TOKEN_KEY = "edgefly_token";
const token = localStorage.getItem(TOKEN_KEY);
const path = window.location.pathname;

// ⏳ Wait if navigation transition is happening
if (!window.EDGEFLY_NAV_TRANSITION) {
    showLoader("Loading EdgeFly...", "circle");
}

setTimeout(() => {
    const isGuestPage =
        path.endsWith("/index.html") ||
        path.endsWith("/") ||
        path.includes("/get_started.html");

    const isUserPage =
        path.includes("/dashboard.html") ||
        path.includes("/wishlist.html") ||
        path.includes("/history.html") ||
        path.includes("/recommendations.html") ||
        path.includes("/profile.html") ||
        path.includes("/account.html");

    function decodeJwtPayload(jwt) {
        try {
            const payload = jwt.split(".")[1];
            return JSON.parse(atob(payload));
        } catch {
            return null;
        }
    }

    // Auth logic
    if (isUserPage && !token) {
        showLoader("Redirecting to sign in…", "circle");
        setTimeout(() => (window.location.href = "../pages/get_started.html"), 2200);
    } else if (isGuestPage && token) {
        showLoader("Loading your dashboard…", "circle");
        setTimeout(() => (window.location.href = "../pages/dashboard.html"), 2200);
    } else if (token) {
        const payload = decodeJwtPayload(token);
        if (payload?.exp && Date.now() / 1000 > payload.exp) {
            localStorage.removeItem(TOKEN_KEY);
            window.EDGEFLY_USER_EMAIL = null;
            window.EDGEFLY_USER_NAME = null;
            showLoader("Session expired — logging out…", "circle");
            setTimeout(() => (window.location.href = "../pages/get_started.html"), 2500);
        } else {
            hideLoader();
        }
    } else {
        hideLoader();
    }
}, 700);
