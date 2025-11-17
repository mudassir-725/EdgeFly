// client/js/renderCard.js
// Flight card renderer (module) — uses iataUtils for friendly names
import { getCityName, getAirlineName, loadIataData } from "./utils/iataUtils.js";

/**
 * renderFlightCard(f, opts)
 * - opts.showWishlist : show wishlist add/remove button (default true)
 * - opts.showDelete : show delete (used on wishlist page)
 * - opts.passengers : number
 *
 * Returns HTML string to inject into DOM.
 */
export function renderFlightCard(f = {}, opts = {}) {
  // attempt to use itineraries to find segments
  const firstSeg = f.itineraries?.[0]?.segments?.[0];
  const lastSeg = f.itineraries?.[0]?.segments?.slice(-1)[0];

  const originCode = (firstSeg?.departure?.iataCode || f.origin || f.from || "").toUpperCase();
  const destinationCode = (lastSeg?.arrival?.iataCode || f.destination || f.to || "").toUpperCase();

  const origin = getCityName(originCode) || originCode || "N/A";
  const destination = getCityName(destinationCode) || destinationCode || "N/A";

  const departAt = firstSeg?.departure?.at || f.departureDate || f.departure || "";
  const departDate = departAt ? departAt.split("T")[0] : "";

  const returnAt = f.itineraries?.[1]?.segments?.[0]?.departure?.at || f.returnDate || f.return || "";
  const returnDate = returnAt ? returnAt.split("T")[0] : "";

  const airlineCode = f.airline || f.carrierCode || (firstSeg?.carrierCode || "");
  const airline = getAirlineName((airlineCode || "").toUpperCase()) || airlineCode || "Unknown";

  const price = f.totalPrice || f.price?.total || f.price || "—";
  const currency = f.currency || f.price?.currency || "USD";

  const travelClass = (f.travelClass || f.class || "Economy");
  const passengers = f.passengers || opts.passengers || 1;

  const showDelete = !!opts.showDelete;
  const showWishlist = opts.showWishlist !== false; // default true

  // prepare safe JSON payload attribute for wishlist button
  function safeJsonAttr(obj) {
    try {
      return JSON.stringify(obj).replaceAll("'", "\\u0027").replaceAll('"', "&quot;");
    } catch {
      return "{}";
    }
  }

  // Minimal flight object to send to API when adding
  const payload = {
    id: f.id,
    origin: originCode,
    destination: destinationCode,
    departureDate: departDate,
    returnDate: returnDate || null,
    price,
    currency,
    airline: airlineCode,
    passengers,
    travelClass
  };

  // ← ↔ →
  return `
  <div class="flight-card bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden p-8" data-id="${f.id || ""}">
    <div class="flex justify-between items-start gap-4">
      <div class="flex-1">
        <h2 class="text-lg font-semibold">${origin} ↔ ${destination}</h2>
        <p class="text-sm text-accent-light dark:text-accent-dark mt-1">
          ${departDate ? `Depart: ${departDate}` : "—"} ${returnDate ? `· Return: ${returnDate}` : "—"}
        </p>
        <p class="text-sm text-accent-light dark:text-accent-dark mt-1">
          Airline: ${airline}  |  Class: ${travelClass}  |  Passenger${passengers > 1 ? "s:" : ":"} ${passengers}
        </p>

        ${(f.itineraries || []).map((it, i) => `
          <div class="mt-3 pl-3 p-1 border-l-2 border-primary/30">
            <div class="text-xs font-semibold m-2 text-[#ffa200]">${i === 0 ? "Outbound" : "Inbound"} — ${String(it.duration || "").replace("PT", "").toLowerCase()}</div>
            ${(it.segments || []).map(s => `
              <div class="text-sm mb-1 flex items-center gap-2">
                <span class="font-medium">${getCityName((s.departure?.iataCode || "").toUpperCase())}</span>
                <span class="material-symbols-outlined text-xs">arrow_right_alt</span>
                <span class="font-medium">${getCityName((s.arrival?.iataCode || "").toUpperCase())}</span>
                <span class="text-xs opacity-70">(${s.carrierCode || ""}${s.number ? " " + s.number : ""})</span>
              </div>
            `).join("")}
          </div>
        `).join("")}
        <div class="text-2xl font-bold text-[#ffa200] p-4">${currency} ${price}</div>
      </div>

      <div class="flex flex-col items-end gap-4">

        ${showWishlist ? `<button class="wishlist-btns flex items-center gap-2 px-3 py-1 rounded hover:opacity-90" aria-pressed="false" data-flight="${safeJsonAttr(payload)}" title="Save to wishlist">
            <span class="material-symbols-outlined wishlist-icon">heart_plus</span>
          </button>` : ""}

        ${showDelete ? `<button class="delete-btn text-red-500" data-id="${f.id || ""}" title="Remove from wishlist"><span class="material-symbols-outlined">delete</span></button>` : ""}
      </div>
    </div>
  </div>
  `;
}
