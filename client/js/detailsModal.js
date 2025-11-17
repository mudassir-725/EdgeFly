// client/js/detailsModal.js
import * as EdgeApi from "./api.js";

// lightweight toast (modal may be loaded standalone)
function showToast(message, timeout = 3000) {
  const containerId = "edgefly-toast-container";
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    container.style = "position:fixed;right:20px;top:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;";
    document.body.appendChild(container);
  }
  const t = document.createElement("div");
  t.style = "pointer-events:auto;background:#f7ce87;color:#1c160d;padding:10px 14px;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,0.12);font-weight:600;max-width:320px;";
  t.textContent = message;
  container.appendChild(t);
  setTimeout(() => {
    t.style.transition = "opacity 300ms ease, transform 300ms ease";
    t.style.opacity = "0";
    t.style.transform = "translateY(-8px)";
    setTimeout(() => t.remove(), 350);
  }, timeout);
}

function createModal() {
  if (document.getElementById("flight-details-modal")) return;
  const modal = document.createElement("div");
  modal.id = "flight-details-modal";
  modal.className = "fixed inset-0 z-50 hidden items-center justify-center bg-black/40";
  modal.innerHTML = `
  <div class="max-w-3xl w-full bg-card-light dark:bg-card-dark rounded-lg overflow-hidden shadow-xl">
    <div class="p-4 border-b flex justify-between items-center">
      <h3 class="font-bold">Flight details</h3>
      <button id="flight-details-close" class="text-2xl">×</button>
    </div>
    <div id="flight-details-body" class="p-4 max-h-[60vh] overflow-y-auto text-sm"></div>
    <div class="p-4 border-t flex justify-end gap-3">
      <button id="flight-details-wishlist" class="bg-primary text-background-dark px-4 py-2 rounded">Save to wishlist</button>
      <button id="flight-details-close-2" class="px-4 py-2 rounded border">Close</button>
    </div>
  </div>`;
  document.body.appendChild(modal);

  document.getElementById("flight-details-close").onclick = hideModal;
  document.getElementById("flight-details-close-2").onclick = hideModal;
}

function showModal() {
  const m = document.getElementById("flight-details-modal");
  if (!m) return;
  m.classList.remove("hidden");
  m.classList.add("flex");
}

function hideModal() {
  const m = document.getElementById("flight-details-modal");
  if (!m) return;
  m.classList.add("hidden");
  m.classList.remove("flex");
}

function renderFlightDetails(f) {
  if (!f) return "<p>No details</p>";
  const airline = f.airline || f.itineraries?.[0]?.segments?.[0]?.carrierCode || "—";
  const origin = f.origin || f.itineraries?.[0]?.segments?.[0]?.departure?.iataCode || "—";
  const destination = f.destination || f.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.iataCode || "—";
  const price = f.price || f.totalPrice || "—";
  const dep = f.departureDate || f.itineraries?.[0]?.segments?.[0]?.departure?.at || "";
  const ret = f.returnDate || f.itineraries?.[1]?.segments?.[0]?.departure?.at || "";

  let html = `<h4 class="font-semibold">${airline} • ${origin} → ${destination}</h4>
    <p class="text-xs text-muted">${dep ? `Departure: ${new Date(dep).toLocaleString()}` : ""} ${ret ? `• Return: ${new Date(ret).toLocaleString()}` : ""}</p>
    <div class="mt-3">Price: <strong>${price}</strong></div>
    <div class="mt-3">Itineraries:</div>`;

  (f.itineraries || []).forEach((it, idx) => {
    html += `<div class="mt-2 pl-3 border-l-2 border-primary/30">
      <div class="text-xs font-semibold">${idx === 0 ? "Outbound" : "Return"} • ${it.duration || ""}</div>
      ${(it.segments || []).map(s => `
        <div class="mt-1 text-sm">
          <div><strong>${s.departure?.iataCode || ""}</strong> → <strong>${s.arrival?.iataCode || ""}</strong></div>
          <div class="text-xs opacity-70">${s.carrierCode || ""}${s.number ? " " + s.number : ""} • ${s.duration || ""}</div>
        </div>
      `).join("")}
    </div>`;
  });

  return html;
}

createModal();

// delegated click: open modal
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".details-btn");
  if (!btn) return;
  const fstr = btn.getAttribute("data-flight") || "{}";
  let flight;
  try { flight = JSON.parse(fstr.replaceAll("&apos;", "'")); } catch { flight = {}; }
  const body = document.getElementById("flight-details-body");
  body.innerHTML = renderFlightDetails(flight);

  // wire wishlist button to call API directly
  const saveBtn = document.getElementById("flight-details-wishlist");
  saveBtn.onclick = async () => {
    try {
      const res = await EdgeApi.wishlistAdd(flight);
      if (res?.success === false) {
        showToast(res.message || "Save failed");
      } else {
        showToast("Saved to wishlist");
        // notify other modules
        document.dispatchEvent(new Event("wishlist:changed"));
      }
    } catch (err) {
      console.error("details modal save error", err);
      showToast("Save failed (network)");
    }
    hideModal();
  };

  showModal();
});

export function openDetailsModal(flight) {
  const f = flight.flight || flight;
  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 bg-black/60 flex items-center justify-center z-50";

  overlay.innerHTML = `
    <div class="bg-background-light dark:bg-background-dark rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
      <button id="closeModal" class="absolute taop-3 right-3 text-xl font-bold text-text-muted-light dark:text-text-muted-dark hover:text-primary">&times;</button>
      <h2 class="text-2xl font-semibold mb-2">${f.origin || "?"} → ${f.destination || "?"}</h2>
      <p class="text-sm mb-2 text-text-muted-light dark:text-text-muted-dark">${f.travelClass || "Economy"} · ${f.passengers || 1} passenger(s)</p>
      <p class="text-sm mb-2">Departure: ${f.departureDate || "—"}</p>
      ${f.returnDate ? `<p class="text-sm mb-2">Return: ${f.returnDate}</p>` : ""}
      <p class="text-lg font-bold mt-3 text-primary">$${f.price || "?"}</p>
      <div class="mt-6 flex justify-end gap-3">
        <button id="closeBtn" class="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-700">Close</button>
        <button id="wishlistBtn" class="px-4 py-2 rounded-lg bg-primary text-background-dark">Save</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  function close() {
    overlay.remove();
  }

  overlay.querySelector("#closeModal").addEventListener("click", close);
  overlay.querySelector("#closeBtn").addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
}

// Global listener to auto-open when clicking any .details-btn
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".details-btn");
  if (btn) {
    const card = btn.closest("[data-id]");
    const id = card?.dataset.id;
    const data = {}; // could fetch flight details if needed
    openDetailsModal({ ...data, id });
  }
});
