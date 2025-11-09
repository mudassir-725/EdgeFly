// client/js/history.js
import { getSearchHistory } from "./api.js";
import { renderFlightCard } from "./renderCard.js";

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector("#search-history");
    container.innerHTML = "<p>Loading history…</p>";

    try {
        const data = await getSearchHistory();
        const history = data.history || [];

        if (!history.length) {
            container.innerHTML = "<p>No searches found.</p>";
            return;
        }

        container.innerHTML = history
            .map((f) => renderFlightCard(f, { showWishlist: true }))
            .join("");
    } catch (err) {
        container.innerHTML = "<p>Failed to load history.</p>";
        console.error("History error:", err);
    }
});
