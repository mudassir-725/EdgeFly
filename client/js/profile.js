// client/js/profile.js
import * as EdgeApi from "./api.js";
import { showToast } from "./common.js";

document.addEventListener("DOMContentLoaded", async () => {
    const emaildash = document.getElementById("usermail");
    const usernamedash = document.getElementById("username");
    const emailTop = document.getElementById("profile-email-top");
    const usernameTop = document.getElementById("profile-username-top");
    const emailMain = document.getElementById("profile-email-main");
    const usernameMain = document.getElementById("profile-username-main");
    const avatarEl = document.getElementById("profile-avatar");
    const logoutBtn = document.getElementById("logout-btn");

    // Redirect to login if not authenticated
    if (!EdgeApi.isAuthenticated()) {
        showToast?.("Please sign in to view your profile.");
        setTimeout(() => (window.location.href = "../pages/get_started.html"), 800);
        return;
    }

    try {
        const me = await EdgeApi.getMe();

        if (me?.success === false || me?.status === 401) {
            showToast?.("Session expired. Please log in again.");
            EdgeApi.clearToken();
            setTimeout(() => (window.location.href = "../pages/get_started.html"), 800);
            return;
        }

        // Normalize
        const user = me.user || me;
        const email = user.email || "Unknown";
        const username = user.username || email.split("@")[0] || "User";
        const displayName = username.charAt(0).toUpperCase() + username.slice(1);

        // Update all visible fields
        if (emailTop) emailTop.textContent = email;
        if (usernameTop) usernameTop.textContent = displayName;
        if (emaildash) emaildash.textContent = email;
        if (usernamedash) usernamedash.textContent = displayName;
        if (emailMain) emailMain.textContent = email;
        if (usernameMain) usernameMain.textContent = displayName;
        if (avatarEl) avatarEl.textContent = displayName.charAt(0).toUpperCase();

        // Set globals for other pages
        window.EDGEFLY_USER_EMAIL = email;
        window.EDGEFLY_USER_NAME = displayName;

        console.log("✅ Profile loaded:", { email, username: displayName });
    } catch (err) {
        console.error("Profile load failed:", err);
        emailTop.textContent = "Error";
        usernameTop.textContent = "Error";
    }

    // Logout
    logoutBtn?.addEventListener("click", async () => {
        try {
            await EdgeApi.logout();
            showToast?.("Logged out successfully.");
            EdgeApi.clearToken();
            window.EDGEFLY_USER_EMAIL = null;
            window.EDGEFLY_USER_NAME = null;
            setTimeout(() => (window.location.href = "../pages/get_started.html"), 800);
        } catch (err) {
            console.error("Logout failed:", err);
            showToast?.("Logout failed.");
        }
    });
});
