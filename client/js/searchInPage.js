// client/js/searchInPage.js
// ✨ EdgeFly In-Page Search — Reusable & Accessible (v2.3)
// Features:
//  - Highlights all matches
//  - Smooth scroll to first match
//  - Shortcut: "/" to focus
//  - Shortcut: "ESC" to clear & blur
//  - Auto works across all EdgeFly pages with #searchInPage input

export function initSearchInPage() {
    const searchInput = document.querySelector("#searchInPage input[type='text']");
    if (!searchInput) return;

    let lastHighlights = [];

    // 🧽 Clear all existing highlights
    function clearHighlights() {
        lastHighlights.forEach((mark) => {
            const parent = mark.parentNode;
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize();
        });
        lastHighlights = [];
    }

    // ✨ Highlight all keyword matches in main content
    function highlightMatches(keyword) {
        if (!keyword.trim()) return;
        const bodyText = document.querySelector("main");
        const regex = new RegExp(keyword, "gi");

        bodyText.querySelectorAll("*:not(script):not(style)").forEach((el) => {
            if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
                const text = el.textContent;
                if (regex.test(text)) {
                    el.innerHTML = text.replace(
                        regex,
                        (m) => `<mark class='edgefly-highlight'>${m}</mark>`
                    );
                }
            }
        });

        lastHighlights = Array.from(document.querySelectorAll(".edgefly-highlight"));
    }

    // 🎯 Scroll to first visible match
    function scrollToFirst() {
        if (lastHighlights.length > 0) {
            const target = lastHighlights[0];
            const offset = 120;
            const topPos =
                target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top: topPos, behavior: "smooth" });

            // Subtle highlight pulse
            target.classList.add("pulse");
            setTimeout(() => target.classList.remove("pulse"), 1000);
        }
    }

    // 🔍 Handle input changes
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.trim();
        clearHighlights();
        if (query.length >= 2) {
            highlightMatches(query);
            scrollToFirst();
        }
    });

    // ⌨️ Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
        // Focus input on "/" key
        if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }

        // Escape: blur input & clear results
        if (e.key === "Escape") {
            if (document.activeElement === searchInput) {
                searchInput.blur();
            }
            searchInput.value = "";
            clearHighlights();
        }
    });

    // Change input border color when active
    searchInput.addEventListener("focus", () => {
        searchInput.parentElement.style.boxShadow = "0 0 0 2px #ffbb00";
    });

    // Small tooltip that appears when pressing /, saying: “Press ESC to close search”.
    searchInput.addEventListener("blur", () => {
        searchInput.parentElement.style.boxShadow = "none";
    });

}