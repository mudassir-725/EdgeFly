// client/js/dashboard.js
import * as EdgeApi from "./api.js";
import { renderFlightCard } from "./renderCard.js";

async function loadDashboard() {
    // Containers
    const recentsEl = document.getElementById("dashboard-recents-container");
    const wishlistEl = document.getElementById("dashboard-wishlist-container");
    const recsEl = document.getElementById("dashboard-recommendations-container");

    try {
        // Fetch all 3 datasets
        const [history, wishlist, recommendations] = await Promise.all([
            EdgeApi.getSearchHistory(),
            EdgeApi.wishlistGet(),
            EdgeApi.getRecommendations(),
        ]);

        // Recent searches (latest 3)
        if (history?.length) {
            recentsEl.innerHTML = history
                .slice(-3)
                .reverse()
                .map((f) => renderFlightCard(f, { showWishlist: true }))
                .join("");
        } else {
            recentsEl.innerHTML =
                '<p class="text-sm text-text-muted-light dark:text-text-muted-dark">No recent searches yet.</p>';
        }

        // Wishlist preview (latest 3)
        if (wishlist?.length) {
            wishlistEl.innerHTML = wishlist
                .slice(-3)
                .reverse()
                .map((f) => renderFlightCard(f, { showDelete: true }))
                .join("");
        } else {
            wishlistEl.innerHTML =
                '<p class="text-sm text-text-muted-light dark:text-text-muted-dark">Your wishlist is empty.</p>';
        }

        // Recommendations preview (latest 3)
        if (recommendations?.length) {
            recsEl.innerHTML = recommendations
                .slice(0, 3)
                .map((f) => renderFlightCard(f, { showWishlist: true }))
                .join("");
        } else {
            recsEl.innerHTML =
                '<p class="text-sm text-text-muted-light dark:text-text-muted-dark">No recommendations yet.</p>';
        }

    } catch (err) {
        console.error("Dashboard load error:", err);
        recentsEl.innerHTML = wishlistEl.innerHTML = recsEl.innerHTML =
            '<p class="text-red-500 text-sm">Failed to load dashboard data.</p>';
    }
}

document.addEventListener("DOMContentLoaded", loadDashboard);
