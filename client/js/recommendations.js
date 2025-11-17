// client/js/Recommendations.js
import { getRecommendations, wishlistAdd } from "./api.js";
import { renderFlightCard } from "./renderCard.js";

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector("#recommendations");
    container.innerHTML = "<p>Fetching recommendations…</p>";

    try {
        const data = await getRecommendations();
        const recs = data.recommendations || [];

        if (!recs.length) {
            container.innerHTML = "<p>No recommendations yet.</p>";
            return;
        }

        container.innerHTML = recs
            .map((f) => renderFlightCard(f, { showWishlist: true }))
            .join("");
    } catch (err) {
        container.innerHTML = "<p>Failed to load recommendations.</p>";
        console.error("Recommendations error:", err);
    }

    // Add-to-wishlist handler
    container.addEventListener("click", async (e) => {
        const btn = e.target.closest(".wishlist-btn");
        if (btn) {
            const id = btn.dataset.id;
            const flight = { id }; // minimal; adjust with your backend schema
            try {
                await wishlistAdd(flight);
                alert("Added to wishlist!");
            } catch (err) {
                alert("Failed to save flight.");
            }
        }
    });
});
