// client/js/common.js
import * as EdgeApi from "./api.js";
import { loadIataData } from "./utils/iataUtils.js";

/* ---------- TOAST SYSTEM ---------- */
export function showToast(message = "Action complete") {
    const container = document.getElementById("toast-container") || (() => {
        const c = document.createElement("div");
        c.id = "toast-container";
        c.className =
            "fixed bottom-6 right-6 z-[100] flex flex-col gap-3 items-end pointer-events-none";
        document.body.appendChild(c);
        return c;
    })();

    const toast = document.createElement("div");
    toast.className =
        "flex items-center justify-between gap-4 bg-subtle-light dark:bg-subtle-dark text-stone-900 dark:text-stone-100 shadow-lg rounded-2xl border border-stone-200 dark:border-stone-700 px-5 py-3 w-[320px] opacity-0 translate-y-4 transition-all duration-500 pointer-events-auto";
    toast.innerHTML = `
    <div class='flex items-center gap-3'>
      <div class='w-3 h-3 rounded-full bg-primary animate-pulse'></div>
      <p class='font-medium'>${message}</p>
    </div>
    <button class='text-stone-500 hover:text-stone-900 dark:hover:text-stone-300 text-xl leading-none'>&times;</button>
  `;

    container.appendChild(toast);
    requestAnimationFrame(() =>
        toast.classList.remove("opacity-0", "translate-y-4")
    );

    const hideTimeout = setTimeout(() => hideToasts(toast), 5000);
    toast.querySelector("button").onclick = () => {
        clearTimeout(hideTimeout);
        hideToasts(toast);
    };
}

// 🧩 Hide + remove a toast smoothly
export function hideToasts(toast) {
    toast.classList.add("opacity-0", "translate-y-4");
    setTimeout(() => toast.remove(), 500);
}

/* ---------- Wishlist Toggle Handler ---------- */
export function attachWishlistDelegates() {
    if (document.__edgefly_wishlist_attached) return;
    document.__edgefly_wishlist_attached = true;

    document.addEventListener("click", async (e) => {
        const btn = e.target.closest(".wishlist-btn");
        if (!btn) return;

        e.preventDefault();
        let flight;
        try {
            flight = JSON.parse(btn.dataset.flight || "{}");
        } catch {
            flight = {};
        }

        const fid = flight.id || flight.offerId || flight.offer_id || null;
        const icon = btn.querySelector(".wishlist-icon");

        const setIcon = (saved) => {
            if (!icon) return;
            icon.textContent = saved ? "heart_check" : "heart_plus";
            btn.setAttribute("aria-pressed", saved ? "true" : "false");
            icon.classList.toggle("text-primary", saved);
        };

        if (!EdgeApi.isAuthenticated()) {
            showToast("Sign in to use Wishlist.");
            return;
        }

        try {
            const listResp = await EdgeApi.wishlistGet();
            const items = listResp?.items || [];
            const exists = fid && items.some((it) => String(it.id) === String(fid));

            if (!exists) {
                const addRes = await EdgeApi.wishlistAdd(flight);
                if (addRes?.success === false) {
                    showToast(addRes.message || "Add failed");
                    return;
                }
                setIcon(true);
                showToast("Added to wishlist ✈️");
                document.dispatchEvent(new Event("wishlist:changed"));
            } else {
                const delRes = await EdgeApi.wishlistDelete(fid);
                if (delRes?.success === false) {
                    showToast(delRes.message || "Remove failed");
                    return;
                }
                setIcon(false);
                showToast("Removed from wishlist 💔");
                document.dispatchEvent(new Event("wishlist:changed"));
            }
        } catch (err) {
            console.error("Wishlist toggle error:", err);
            showToast("Wishlist action failed");
        }
    });
}

/* ---------- Preload IATA maps ---------- */
export async function preloadIataIfNeeded() {
    try {
        await loadIataData();
    } catch {
        /* ignore */
    }
}
