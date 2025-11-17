// client/js/wishlist.js
import { wishlistGet, wishlistDelete } from "./api.js";
import { renderFlightCard } from "./renderCard.js";
import { preloadIataIfNeeded, showToast } from "./common.js";

const containerSelector = "#wishlist-container";

async function loadWishlist() {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    container.innerHTML = "<p>Loading wishlist…</p>";

    try {
        await preloadIataIfNeeded();
        const data = await wishlistGet();
        if (!data || data.success === false) {
            container.innerHTML = "<p>No saved flights or you are not signed in.</p>";
            return;
        }

        // support several shapes
        const items = data.items || data.wishlist || (Array.isArray(data) ? data : []);
        if (!items.length) {
            container.innerHTML = '<p class="text-gray-500 text-center">No items in your wishlist yet.</p>';
            return;
        }

        container.innerHTML = items.map(f => renderFlightCard(f, { showDelete: true, showWishlist: false })).join("");

    } catch (err) {
        console.error("Wishlist load failed:", err);
        container.innerHTML = "<p>Failed to load wishlist.</p>";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadWishlist();

    // delegated delete
    document.querySelector(containerSelector)?.addEventListener("click", async (e) => {
        const del = e.target.closest(".delete-btn");
        if (!del) return;
        const id = del.getAttribute("data-id");
        if (!id) return;
        if (!confirm("Remove this flight from wishlist?")) return;
        try {
            const res = await wishlistDelete(id);
            if (res?.success === false) {
                showToast(res.message || "Failed to remove.");
            } else {
                showToast("Removed from wishlist.");
                loadWishlist();
            }
        } catch (err) {
            console.error("Delete wishlist error:", err);
            showToast("Failed to remove item.");
        }
    });

    // refresh on external update
    document.addEventListener("wishlist:changed", () => loadWishlist());
});
