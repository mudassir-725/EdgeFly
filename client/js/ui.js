// client/js/ui.js
// UI wiring & page logic for EdgeFly frontend
// ES module that depends on client/js/api.js
// Usage: <script type="module" src="../js/ui.js"></script>

import * as EdgeApi from "./api.js";
import { showLoader, hideLoader } from "./loader.js"; // Loaders

/* ---------------
  NOTES:
  - This file is page-aware: it looks for specific containers and binds behavior only when present.
  - Repeated card elements use data attributes (data-id, data-role) rather than duplicate IDs.
  --------------- */

// ---------- small UI helpers ----------
function toast(message, ms = 4000) {
    // minimal toast without external libs
    const id = "edgefly-ui-toast-root";
    let root = document.getElementById(id);
    if (!root) {
        root = document.createElement("div");
        root.id = id;
        root.style = "position:fixed;right:20px;top:20px;z-index:9999;";
        document.body.appendChild(root);
    }
    const item = document.createElement("div");
    item.textContent = message;
    item.style = "background:#f7ce87;color:#1c160d;padding:10px 14px;margin-top:8px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,.12);font-weight:600";
    root.appendChild(item);
    setTimeout(() => {
        item.style.opacity = "0";
        setTimeout(() => item.remove(), 350);
    }, ms);
}
// Small, consistent toast used by card actions & other UI bits
function showToast(message, timeout = 3500) {
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
    // fade out + remove
    setTimeout(() => {
        t.style.transition = "opacity 300ms ease, transform 300ms ease";
        t.style.opacity = "0";
        t.style.transform = "translateY(-8px)";
        setTimeout(() => t.remove(), 350);
    }, timeout);
}


// safe JSON stringify for embedding
function safeStringify(obj) {
    try {
        return JSON.stringify(obj).replaceAll("'", "\\u0027");
    } catch {
        return "{}";
    }
}

// ---------- DOM helpers for delegated events ----------
function onDocumentClick(selectorTest, handler) {
    document.addEventListener("click", (evt) => {
        const el = evt.target.closest(selectorTest);
        if (el) handler(evt, el);
    });
}

// ---------- Render helpers ----------
function renderFlightCard(f) {
    // f: flight object (minimal shape)
    const flightPrice = f.price ? `$${f.price}` : (f.totalPrice ? `${f.currency || ""} ${f.totalPrice}` : "—");
    // use data attributes rather than ids for repeated elements
    return `
    <div class="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col md:flex-row p-4" data-role="wish-item" data-id="${f.id || ""}">
      <div class="flex-1">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-xl font-bold">${escapeHtml(f.origin || "—")} → ${escapeHtml(f.destination || "—")}</h3>
            <p class="text-sm text-muted mt-1">${escapeHtml(f.oneway ? "One way" : "Round trip")} · ${escapeHtml(String(f.passengers || 1))} passenger(s) · ${escapeHtml(f.travelClass || f.class || "Economy")}</p>
            <p class="text-sm text-muted mt-1">Depart: <span class="text-sm">${escapeHtml(f.departureDate || f.departure || "—")}</span></p>
            <p class="text-sm text-muted mt-1">Return: <span class="text-sm">${escapeHtml(f.returnDate || f.return || "—")}</span></p>
          </div>
          <div>
            <button class="text-text-muted-light dark:text-text-muted-dark hover:text-red-500 transition-colors" data-delete-wish="${f.id || ""}">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between">
          <div>
            <p class="text-sm text-muted">Current price</p>
            <p class="text-2xl font-bold text-primary">${flightPrice}</p>
          </div>
          <div>
            <button class="bg-primary text-background-dark font-bold py-2 px-4 rounded-lg shadow-md" data-role="details" data-id="${f.id || ""}">Details</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

// ----------- robust JSON extraction helper -----------
function extractJsonArray(raw) {
    if (!raw) return null;
    if (Array.isArray(raw)) return raw;
    let text = typeof raw === "string" ? raw : JSON.stringify(raw);
    // Remove markdown-style ```json fences or text before/after
    const match = text.match(/\[.*\]/s);
    if (!match) return null;
    try {
        const parsed = JSON.parse(match[0]);
        return Array.isArray(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

// ---------- flight search binding ----------
function bindFlightForm(selector = "#flight-search-form") {
    const form = document.querySelector(selector);
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        showLoader("Searching flights…", "squares"); // stays until hidden manually

        const origin = form.querySelector("#origin")?.value?.trim();
        const destination = form.querySelector("#destination")?.value?.trim();
        const departureDate = form.querySelector("#departure")?.value?.trim();
        const returnDate = form.querySelector("#return")?.value?.trim() || null;
        const travelClass = (form.querySelector("#travelclass")?.value || "economy").toUpperCase();
        const passengers = parseInt(form.querySelector("#passenger")?.value || "1", 10);

        if (!origin || !destination || !departureDate) {
            toast("Please fill origin, destination and departure date.");
            return;
        }

        const payload = {
            origin, destination, departureDate, returnDate, travelClass, passengers
        };

        try {
            // choose endpoint based on auth
            const res = EdgeApi.isAuthenticated() ? await EdgeApi.searchFlightsUser(payload) : await EdgeApi.searchFlightsGuest(payload);

            // normalized response handling:
            // If apiFetch returned { success: false, ... } the API library returns that object
            if (res && res.success === false) {
                throw new Error(res.message || "Search failed");
            }

            // try to pick flights array commonly returned
            const flights = res?.results || res?.flights || (Array.isArray(res) ? res : null);
            if (!flights || !flights.length) {
                toast("No flights found.");
            } else {
                toast(`Found ${flights.length} flights`);

                // ✅ Store query and results in localStorage
                localStorage.setItem(
                    "edgefly_search_results",
                    JSON.stringify({ query: payload, results: flights })
                );

                // ✅ Redirect to search_results.html
                // window.location.href = "../pages/search_results.html";
                setTimeout(() => {
                    hideLoader();
                    window.location.href = "../pages/search_results.html";
                }); // 10 seconds visible even if search is instant
                return; // stop further in-page rendering

            }

            // (optional fallback for pages that actually have #flight-results)
            const out = document.querySelector("#flight-results");
            if (out) {
                out.innerHTML = (flights && flights.length)
                    ? `<div class="grid gap-3">${flights.map(f => {
                        const small = {
                            id: f.id || f.offerId || (f.totalPrice ? `${f.totalPrice}-${Math.random().toString(36).slice(2, 6)}` : ""),
                            origin: f.itineraries?.[0]?.segments?.[0]?.departure?.iataCode || f.origin || f.from,
                            destination: f.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.iataCode || f.destination || f.to,
                            departureDate: f.itineraries?.[0]?.segments?.[0]?.departure?.at?.slice(0, 10) || f.departureDate || f.departure,
                            returnDate: f.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.at?.slice(0, 10) || f.returnDate || null,
                            price: f.totalPrice || f.price || (f.pricePerSeat ? f.pricePerSeat : null),
                            currency: f.currency || f.priceCurrency,
                            airline: f.airline || f.validatingAirlineCodes?.[0] || (f.itineraries?.[0]?.segments?.[0]?.carrierCode || null),
                            passengers,
                            travelClass
                        };
                        const cardHtml = `
            <div class="p-3 rounded-lg shadow-sm bg-card-light dark:bg-card-dark">
              <div class="flex justify-between items-start">
                <div>
                  <div class="font-bold">${escapeHtml(small.airline || "—")} • ${escapeHtml(small.id || "")}</div>
                  <div class="text-sm text-muted">${escapeHtml(small.origin || "")} → ${escapeHtml(small.destination || "")}</div>
                </div>
                <div class="text-right">
                  <div class="font-bold">${small.currency ? small.currency + " " + small.price : small.price || "—"}</div>
                  <button data-add-wish class="mt-2 px-3 py-1 rounded bg-primary text-background-dark" data-flight='${safeStringify(small)}'>Save</button>
                </div>
              </div>
            </div>`;
                        return cardHtml;
                    }).join("")}</div>`
                    : "<p>No flights</p>";
            }
        } catch (err) {
            hideLoader();
            console.error("Flight search error:", err);
            toast(err.message || "Flight search failed");
        }
    });
}

// ---------- results actions (save / delete) ----------
function bindResultsActions() {
    // Save flight from results (delegated)
    onDocumentClick("[data-add-wish]", async (_, el) => {
        const payloadStr = el.getAttribute("data-flight") || "{}";
        let payload;
        try { payload = JSON.parse(payloadStr); } catch { payload = {}; }

        const flightObj = {
            origin: payload.origin,
            destination: payload.destination,
            departureDate: payload.departureDate,
            price: payload.price,
            airline: payload.airline
        };

        try {
            const r = await EdgeApi.wishlistAdd(flightObj);
            if (r && r.success === false) throw new Error(r.message || "Save failed");
            toast("Saved to wishlist");
            await refreshWishlist();
        } catch (err) {
            console.error("Save to wishlist error:", err);
            toast("Save failed: " + (err.message || "unknown"));
        }
    });

    // Delete wishlist item (delegated)
    onDocumentClick("[data-delete-wish]", async (_, el) => {
        const id = el.getAttribute("data-delete-wish");
        if (!id) return;
        if (!confirm("Delete this wishlist item?")) return;
        try {
            const r = await EdgeApi.wishlistDelete(id);
            if (r && r.success === false) throw new Error(r.message || "Delete failed");
            toast("Deleted.");
            await refreshWishlist();
        } catch (err) {
            console.error("Delete wishlist error:", err);
            toast("Delete failed.");
        }
    });

    // Details button - can be wired to open modal or link
    onDocumentClick("[data-role='details']", (_, el) => {
        const id = el.getAttribute("data-id");
        toast(`Details for ${id || "item"}`);
        // hook for future modal
    });
}

// ----- delegated global click handler (save/delete) -----
document.addEventListener("click", async (e) => {
    // Save to wishlist buttons have attribute data-add-wish with JSON payload
    const saveBtn = e.target.closest("[data-add-wish]");
    if (saveBtn) {
        e.preventDefault();
        let flight = {};
        const payloadRaw = saveBtn.getAttribute("data-add-wish") || "{}";
        try {
            flight = JSON.parse(payloadRaw.replaceAll("&apos;", "'"));
        } catch (err) {
            console.warn("Failed parsing flight json from data-add-wish", err);
        }

        try {
            // call API
            const res = await EdgeApi.wishlistAdd(flight);
            // api.js returns either { success: false, message } or actual object
            if (res?.success === false) {
                showToast(res.message || "Save failed");
            } else {
                showToast("Saved to wishlist");
                // allow other modules (wishlist page) to refresh
                document.dispatchEvent(new Event("wishlist:changed"));
            }
        } catch (err) {
            console.error("wishlist add error", err);
            showToast(err?.message || "Save failed (network)");
        }
        return;
    }

    // Delete wishlist item (buttons must be data-delete-wish="<id>")
    const delBtn = e.target.closest("[data-delete-wish]");
    if (delBtn) {
        e.preventDefault();
        const id = delBtn.getAttribute("data-delete-wish");
        if (!id) {
            showToast("Invalid wishlist id");
            return;
        }
        if (!confirm("Delete this wishlist item?")) return;
        try {
            const res = await EdgeApi.wishlistDelete(id);
            if (res?.success === false) {
                showToast(res.message || "Delete failed");
            } else {
                showToast("Deleted from wishlist");
                document.dispatchEvent(new Event("wishlist:changed"));
            }
        } catch (err) {
            console.error("wishlist delete error", err);
            showToast("Delete failed (network)");
        }
        return;
    }

    // (Other global delegated handlers can remain below or above)
});


// ---------- refresh / render containers ----------
async function refreshWishlist(containerSelector = "#wishlist-container") {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    try {
        const data = await EdgeApi.wishlistGet();
        if (!data || data.success === false) {
            // api returned error-like obj
            container.innerHTML = `<p>No wishlist items or you are not signed in.</p>`;
            return;
        }
        const items = data.items || data.wishlist || (Array.isArray(data) ? data : []);
        if (!items.length) {
            container.innerHTML = "<p>No wishlist items.</p>";
            return;
        }
        container.innerHTML = items.map(it => renderFlightCard(it)).join("");
    } catch (err) {
        console.error("refreshWishlist:", err);
        container.innerHTML = "<p>Failed to load wishlist.</p>";
    }
}

async function refreshSearchHistory(containerSelector = "#search-history") {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    try {
        const data = await EdgeApi.getSearchHistory();
        if (!data || data.success === false) {
            container.innerHTML = "<p>No recent searches.</p>";
            return;
        }
        const items = data.history || data.items || [];
        if (!items.length) {
            container.innerHTML = "<p>No recent searches.</p>";
            return;
        }
        container.innerHTML = items.map(s => `
      <div class="p-2 rounded-md border mb-2">
        <div class="text-sm font-bold">${escapeHtml(s.origin || "—")} → ${escapeHtml(s.destination || "—")}</div>
        <div class="text-xs text-muted">${escapeHtml(s.departureDate || "")} • ${escapeHtml(s.createdAt || "")}</div>
      </div>
    `).join("");
    } catch (err) {
        console.error("refreshSearchHistory:", err);
        container.innerHTML = "<p>Failed to load history.</p>";
    }
}

async function refreshRecommendations(containerSelector = "#recommendations") {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    try {
        const d = await EdgeApi.getRecommendations();
        if (!d || d.success === false) {
            container.innerHTML = "<p>No recommendations yet.</p>";
            return;
        }
        const recs = d.recommendations || d.items || [];
        if (!recs.length) container.innerHTML = "<p>No recommendations yet.</p>";
        else container.innerHTML = recs.map(r => `<div class="p-2 border rounded mb-2">${escapeHtml(r.suggestion || r.title || r)}</div>`).join("");
    } catch (err) {
        console.error("refreshRecommendations:", err);
        container.innerHTML = "<p>Failed to load recommendations.</p>";
    }
}

async function refreshDashboard() {
    const el = document.querySelector("#dashboard-root");
    if (!el) return;
    try {
        const r = await EdgeApi.getDashboard();
        if (!r || r.success === false) {
            el.innerHTML = "<p>Failed to fetch dashboard or unauthorized.</p>";
            return;
        }
        const dashboard = r.dashboard || r;
        el.innerHTML = `
      <h3 class="font-bold">Recent Searches</h3>
      <div id="db-recent">${(dashboard.recentSearches || []).slice(0, 5).map(s => `<div>${escapeHtml(s.origin)} → ${escapeHtml(s.destination)} (${escapeHtml(s.departureDate)})</div>`).join("") || "<div>none</div>"}</div>
      <h3 class="font-bold mt-3">Wishlist</h3>
      <div id="db-wish">${(dashboard.wishlist || []).map(w => `<div>${escapeHtml(w.origin)} → ${escapeHtml(w.destination)} • ${escapeHtml(w.airline || "")} ${w.price ? "$" + escapeHtml(w.price) : ""}</div>`).join("") || "<div>none</div>"}</div>
      <h3 class="font-bold mt-3">Suggestions</h3>
      <div id="db-suggest">${(dashboard.suggestedRoutes || []).join(", ") || "<div>nothing yet</div>"}</div>
    `;
    } catch (err) {
        console.error("refreshDashboard:", err);
        el.innerHTML = "<p>Failed to fetch dashboard.</p>";
    }
}

// ---------- EdgeAgent binding ----------
function bindEdgeAgent() {
    const tryBtn = document.querySelector("#Try-EdgeAgent");
    const sendBtn = document.querySelector("#Send-Query-G");
    const inlineInput = document.querySelector("#edgeagent-meta input[type='text']") || document.querySelector("input[placeholder*='Flights to']");

    if (tryBtn) {
        tryBtn.addEventListener("click", () => {
            if (!EdgeApi.isAuthenticated()) {
                toast("Sign in to use ELI.");
                window.location.href = "/pages/get_started.html";
                return;
            }
            inlineInput?.focus();
        });
    }

    if (sendBtn) {
        sendBtn.addEventListener("click", async () => {
            const val = inlineInput?.value?.trim();
            if (!val) return toast("Type something for ELI.");

            try {
                toast("Asking ELI…");

                const resp = EdgeApi.isAuthenticated()
                    ? await EdgeApi.askAgentUser(val)
                    : await EdgeApi.askAgentGuest(val);

                console.log("🧠 ELI raw response:", resp);

                if (!resp || resp.success === false) {
                    toast(resp?.message || "ELI unavailable");
                    return;
                }

                const chat = document.querySelector("#eli-messages");
                const message = resp.message || "I'm not sure what you meant.";
                const intent = resp.assistantIntent || "Q/A";
                const flights = Array.isArray(resp.flights) ? resp.flights : [];

                // 1️⃣ Show ELI’s main message
                if (chat) {
                    const botMsg = document.createElement("div");
                    botMsg.className = "flex flex-col items-start gap-2 mb-3";
                    botMsg.innerHTML = `
                <div class="text-xs font-bold text-gray-400">E L I</div>
                <div class="bg-primary/20 dark:bg-primary/30 p-3 rounded-lg rounded-tl-none max-w-md">
                    <p class="text-sm text-background-dark dark:text-background-light">${escapeHtml(message)}</p>
                </div>
            `;
                    chat.appendChild(botMsg);
                    chat.scrollTop = chat.scrollHeight;
                }

                // 2️⃣ If it’s a flight search, send the second message with the "View Flights" button
                if (intent === "search" && flights.length > 0 && resp.searchPayload) {
                    const viewMsg = document.createElement("div");
                    viewMsg.className = "flex flex-col items-start gap-2 mb-3";

                    viewMsg.innerHTML = `
                <div class="text-xs font-bold text-gray-400">E L I</div>
                <div class="bg-primary/10 dark:bg-primary/20 p-3 rounded-lg rounded-tl-none max-w-md">
                    <p class="text-sm text-background-dark dark:text-background-light">
                        I found ${flights.length} flights from 
                        ${escapeHtml(resp.searchPayload.query.origin)} → 
                        ${escapeHtml(resp.searchPayload.query.destination)}.
                    </p>
                </div>
            `;

                    const viewBtn = document.createElement("button");
                    viewBtn.textContent = "View Flights";
                    viewBtn.className =
                        "mt-2 bg-primary text-background-dark px-3 py-1 rounded font-bold shadow-md hover:shadow-lg transition";
                    viewBtn.addEventListener("click", () => {
                        localStorage.setItem("edgefly_search_results", JSON.stringify(resp.searchPayload));
                        const { origin, destination, departureDate } = resp.searchPayload.query;
                        window.location.href = `/pages/search_results.html?from=${origin}&to=${destination}&date=${departureDate}`;
                    });

                    viewMsg.appendChild(viewBtn);
                    chat.appendChild(viewMsg);
                    chat.scrollTop = chat.scrollHeight;
                }
            } catch (err) {
                console.error("ELI error:", err);
                toast("ELI failed: " + (err.message || "unknown"));
            }
        });
    }
}

// ---------- Auth forms bindings ----------
async function localLogin(email, password) {
    // wrapper that calls EdgeApi.login
    const res = await EdgeApi.login({ email, password });
    if (res && res.success === false) throw new Error(res.message || "Login failed");
    return res;
}

function bindAuthForms() {
    const loginForm = document.querySelector("#login-form");
    const regForm = document.querySelector("#registration-form");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            showLoader("Signing In...", "circle ", 10000);

            const email = loginForm.querySelector("input[name='email']")?.value?.trim();
            const password = loginForm.querySelector("input[name='password']")?.value?.trim();
            if (!email || !password) return toast("Please enter email & password");
            try {
                const res = await localLogin(email, password);
                if (res?.token) {
                    EdgeApi.setToken(res.token);
                    toast("Signed in!");
                    // redirect to dashboard if on get_started
                    if (window.location.pathname.includes("/get_started")) {
                        window.location.href = "/pages/dashboard.html";
                    } else {
                        // refresh UI containers
                        await Promise.all([refreshWishlist(), refreshSearchHistory(), refreshDashboard(), refreshRecommendations()]);
                    }
                } else {
                    toast("Login succeeded but no token returned.");
                }
            } catch (err) {
                hideLoader();
                console.error("login failed:", err);
                toast(err.message || "Login failed");
            }
        });
    }

    if (regForm) {
        regForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            showLoader("Registering New User...", "circle", 10000);

            const email = regForm.querySelector("input[name='email']")?.value?.trim();
            const password = regForm.querySelector("input[name='password']")?.value?.trim();
            if (!email || !password) return toast("Please enter details to register");
            try {
                const r = await EdgeApi.register({ email, password });
                if (r && r.success === false) throw new Error(r.message || "Register failed");
                toast("Registered! Please login.");
            } catch (err) {
                hideLoader();
                console.error("register failed:", err);
                toast(err.message || "Register failed");
            }
        });
    }
}

// ---------- common button attachments ----------
// function attachCommonButtons() {
//     const logoutBtn = document.querySelector("#logout-btn");
//     if (logoutBtn) logoutBtn.addEventListener("click", async () => {
//         await EdgeApi.logout();
//         toast("Logged out");
//         window.location.href = "/"; // redirect to index
//     });

//     // populate header user info if present
//     (async () => {
//         if (!EdgeApi.isAuthenticated()) return;
//         try {
//             const me = await EdgeApi.getMe();
//             if (me && !me.success && me.status === 401) return; // not authenticated
//             const mailEl = document.querySelector("#usermail");
//             const nameEl = document.querySelector("#username");
//             if (mailEl && me?.email) mailEl.textContent = me.email;
//             if (nameEl && me?.email) {
//                 const displayName = me.email.split("@")[0];
//                 nameEl.textContent = displayName.charAt(0).toUpperCase() + displayName.slice(1);
//             }
//         } catch (err) {
//             console.error("getMe failed:", err);
//         }
//     })();
// }

// ---------- initialization ----------
async function initOnce() {
    if (window.__edgefly_ui_initialized) return;
    window.__edgefly_ui_initialized = true;

    // Bindings and initial refreshes
    bindFlightForm("#flight-search-form");
    bindFlightForm("#flight-search-form-dashboard");
    bindEdgeAgent();
    bindResultsActions();
    bindAuthForms();
    // attachCommonButtons();

    // Page-specific refresh calls
    if (EdgeApi.isAuthenticated()) {
        refreshWishlist();
        refreshSearchHistory();
        refreshDashboard();
        refreshRecommendations();
    } else {
        // If you want to show something to guests: you can call guest endpoints here
    }

    // delegation handlers must be bound (done above)
}

// Auto init
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOnce);
} else {
    initOnce();
}

// Export for debugging from console
export default {
    initOnce, toast, localLogin,
    refreshWishlist, refreshSearchHistory, refreshRecommendations, refreshDashboard,
    bindFlightForm, bindEdgeAgent, showToast, extractJsonArray
};
