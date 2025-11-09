// client/js/navGuard.js
// EdgeFly Navigation Guard (v3.8)
// Removed loader for <a> clicks to avoid double loaders
// Keeps smooth navigation logic without UI overlap

window.EDGEFLY_NAV_TRANSITION = false;

document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", (e) => {
        const link = e.target.closest("a");
        if (!link || link.target === "_blank") return;

        const href = link.getAttribute("href");
        if (href && href.endsWith(".html") && !href.startsWith("http")) {
            // ✅ No loader for <a> click (authGuard handles it on page load)
            // Just set flag to tell authGuard not to re-show its loader immediately
            e.preventDefault();
            window.EDGEFLY_NAV_TRANSITION = true;

            // Short, natural transition delay (optional)
            setTimeout(() => {
                window.location.href = href;
            }, 150); // small delay for natural click feel
        }
    });
});
