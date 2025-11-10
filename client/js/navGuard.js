// client/js/navGuard.js
// EdgeFly Navigation Guard (v4.0)
// Smooth internal navigation between pages, no double loader flashes.

window.EDGEFLY_NAV_TRANSITION = false;

document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", (e) => {
        const link = e.target.closest("a");
        if (!link || link.target === "_blank") return;

        const href = link.getAttribute("href");
        if (!href || href.startsWith("http") || !href.endsWith(".html")) return;

        e.preventDefault();
        window.EDGEFLY_NAV_TRANSITION = true;

        // Small delay for natural feel
        setTimeout(() => {
            window.location.href = href;
        }, 150);
    });
});
