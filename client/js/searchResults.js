// client/js/searchResults.js
import { renderFlightCard } from "./renderCard.js";
import { attachWishlistDelegates, preloadIataIfNeeded } from "./common.js";

// DOMContentLoaded handler
document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("search-results-container");
    const summary = document.getElementById("search-summary");
    const airlineSelect = document.getElementById("airline-filter");
    const sortSelect = document.getElementById("sort-filter");
    const stopsSelect = document.getElementById("stops-filter");

    let results = [];

    function parseDuration(iso) {
        const match = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
        const hours = parseInt(match?.[1] || "0");
        const mins = parseInt(match?.[2] || "0");
        return hours + mins / 60;
    }

    function getStopsCount(flight) {
        const segs = flight.itineraries?.[0]?.segments || [];
        return Math.max(segs.length - 1, 0);
    }

    function renderList(list) {
        if (!list.length) {
            container.innerHTML = "<p>No flights found.</p>";
            summary.textContent = "0 flights";
            return;
        }
        container.innerHTML = `<div class="grid gap-3">${list.map(f => renderFlightCard(f)).join("")}</div>`;
        // After injecting cards, attach wishlist handler (delegated)
        attachWishlistDelegates();
        // Also update button states by checking wishlist membership (optional enhancement)
        hydrateWishlistButtons();
    }

    // optional: set wishlist icons according to server state
    async function hydrateWishlistButtons() {
        // If user not auth, leave icons default
        const token = localStorage.getItem("edgefly_token");
        if (!token) return;
        try {
            const listResp = await (await import("./api.js")).wishlistGet();
            const items = listResp?.items || listResp?.wishlist || (Array.isArray(listResp) ? listResp : []);
            const ids = new Set(items.map(it => String(it.id)));
            document.querySelectorAll(".wishlist-btn").forEach(btn => {
                const fd = btn.getAttribute("data-flight") || "{}";
                try {
                    const obj = JSON.parse(fd.replaceAll("&quot;", '"'));
                    const id = obj.id;
                    const icon = btn.querySelector(".wishlist-icon");
                    if (!icon) return;
                    if (id && ids.has(String(id))) {
                        icon.textContent = "heart_check";
                        btn.setAttribute("aria-pressed", "true");
                        icon.classList.add("text-primary");
                    } else {
                        icon.textContent = "heart_plus";
                        btn.setAttribute("aria-pressed", "false");
                        icon.classList.remove("text-primary");
                    }
                } catch (err) {
                    // ignore
                }
            });
        } catch (err) {
            // ignore failures (e.g., user not signed in)
        }
    }

    function applyFiltersAndSort() {
        const airline = airlineSelect?.value || "";
        const stops = stopsSelect?.value || "";
        const sort = sortSelect?.value || "";

        let filtered = results.filter(f => {
            const matchAirline = !airline || (f.airline === airline) || (f.validatingAirlineCodes && f.validatingAirlineCodes[0] === airline);
            const stopsCount = getStopsCount(f);
            let matchStops = true;
            if (stops === "0") matchStops = stopsCount === 0;
            else if (stops === "1") matchStops = stopsCount === 1;
            else if (stops === "2") matchStops = stopsCount >= 2;
            return matchAirline && matchStops;
        });

        filtered.sort((a, b) => {
            const priceA = parseFloat(a.totalPrice || a.price?.total || 0);
            const priceB = parseFloat(b.totalPrice || b.price?.total || 0);
            const durA = parseDuration(a.itineraries?.[0]?.duration || "PT0H");
            const durB = parseDuration(b.itineraries?.[0]?.duration || "PT0H");

            switch (sort) {
                case "price-asc": return priceA - priceB;
                case "price-desc": return priceB - priceA;
                case "duration-asc": return durA - durB;
                case "duration-desc": return durB - durA;
                default: return 0;
            }
        });

        summary.textContent = `${filtered.length} flights match your filters`;
        renderList(filtered);
    }

    try {
        // ensure IATA maps loaded
        await preloadIataIfNeeded();

        const stored = localStorage.getItem("edgefly_search_results");
        if (!stored) {
            container.innerHTML = "<p>No results available. Try a new search.</p>";
            return;
        }

        const parsed = JSON.parse(stored);
        // Support different shapes
        results = parsed.results || parsed.flights || parsed.data?.flights || (Array.isArray(parsed) ? parsed : []);

        // If results is still not an array but parsed itself is array:
        if (!Array.isArray(results) && Array.isArray(parsed)) results = parsed;

        if (!Array.isArray(results)) results = [];

        // populate airline filter
        const airlines = [...new Set(results.map(r => r.airline || r.validatingAirlineCodes?.[0] || (r.itineraries?.[0]?.segments?.[0]?.carrierCode || "")))].filter(Boolean);
        airlineSelect.innerHTML = `<option value="">All</option>`;
        airlines.forEach(a => {
            const opt = document.createElement("option");
            opt.value = a;
            opt.textContent = a;
            airlineSelect.appendChild(opt);
        });

        // initial render
        applyFiltersAndSort();

        // attach filter listeners
        document.querySelectorAll("#filter-panel select").forEach(el => el.addEventListener("input", applyFiltersAndSort));
    } catch (err) {
        console.error("searchResults error:", err);
        container.innerHTML = "<p>Error loading results.</p>";
    }
});
