// < !-- ✨ Core Scripts for EdgeFly UX-- >
/* ---------- TOAST SYSTEM ---------- */
function showToast(message = "Sign In to try the EdgeAgent") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className =
        "flex items-center justify-between gap-4 bg-subtle-light dark:bg-subtle-dark text-stone-900 dark:text-stone-100 shadow-lg rounded-2xl border border-stone-200 dark:border-stone-700 px-5 py-10 w-[320px] opacity-0 translate-y-4 transition-all duration-500 pointer-events-auto";

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

    const hideTimeout = setTimeout(() => hideToast(toast), 5000);
    toast.querySelector("button").onclick = () => {
        clearTimeout(hideTimeout);
        hideToast(toast);
    };
}

// 🧩 Hide + remove a toast smoothly
function hideToast(toast) {
    toast.classList.add("opacity-0", "translate-y-4");
    setTimeout(() => toast.remove(), 500);
}

/* ========== DOM READY ========== */
// 🧩 Attach event listeners
document.addEventListener("DOMContentLoaded", () => {
    // Flight form validation
    const flightForm = document.querySelector("#flight-search-form");
    if (flightForm) {
        flightForm.addEventListener("submit", (e) => {
            const requiredInputs = flightForm.querySelectorAll(
                "input[required], input[type='text'], input[type='date']"
            );
            const empty = Array.from(requiredInputs).some(
                (input) => !input.value.trim()
            );
            if (empty) {
                e.preventDefault();
                showToast("Please fill in your travel details before searching.");
            }
        });
    }

    // Show toast if redirected after login/register
    const toastMsg = localStorage.getItem("edgefly-toast");
    if (toastMsg) {
        showToast(toastMsg);
        localStorage.removeItem("edgefly-toast");
    }
});

/* ---------- SMOOTH SCROLL + OFFSET ---------- */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
        const targetId = this.getAttribute("href");
        if (targetId && targetId !== "#") {
            e.preventDefault();
            const target = document.querySelector(targetId);
            if (target) {
                const offset = 100;
                const topPos =
                    target.getBoundingClientRect().top +
                    window.pageYOffset -
                    offset;
                window.scrollTo({ top: topPos, behavior: "smooth" });
            }
        }
    });
});

/* ---------- ACTIVE NAV LINK ON SCROLL ---------- */
const navLinks = document.querySelectorAll('header nav a[href^="#"]');
const sections = Array.from(navLinks).map((link) =>
    document.querySelector(link.getAttribute("href"))
);

window.addEventListener("scroll", () => {
    const scrollPos = window.scrollY + 130;
    sections.forEach((section, index) => {
        if (!section) return;
        const top = section.offsetTop;
        const bottom = top + section.offsetHeight;
        if (scrollPos >= top && scrollPos < bottom) {
            navLinks.forEach((link) =>
                link.classList.remove("text-primary", "font-semibold")
            );
            navLinks[index].classList.add("text-primary", "font-semibold");
        }
    });
});

/* ---------- FADE-IN ANIMATION ON SCROLL ---------- */
const fadeEls = document.querySelectorAll(
    "section, main, header, footer"
);
const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("fade-in-visible");
                observer.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.15 }
);
fadeEls.forEach((el) => {
    el.classList.add("fade-in-start");
    observer.observe(el);
});

// < !--User Avatar Dropdown-- >
// JavaScript to toggle dropdown visibility
document
    .getElementById("user-avatar-btn")
    .addEventListener("click", function () {
        const dropdown = document.getElementById("user-dropdown");
        dropdown.classList.toggle("hidden");
    });

// Optionally, close the dropdown if clicked outside
window.addEventListener("click", function (event) {
    const dropdown = document.getElementById("user-dropdown");
    const button = document.getElementById("user-avatar-btn");
    if (
        !button.contains(event.target) &&
        !dropdown.contains(event.target)
    ) {
        dropdown.classList.add("hidden");
    }
});

// < !--Language Selector Dropdown-- >
const langBtn = document.getElementById("lang-btn");
const langDropdown = document.getElementById("lang-dropdown");
const currentLang = document.getElementById("current-lang");

// Toggle dropdown
langBtn.addEventListener("click", () => {
    langDropdown.classList.toggle("hidden");
});

// Handle language selection
langDropdown.querySelectorAll("button[data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => {
        currentLang.textContent = btn.getAttribute("data-lang");
        langDropdown.classList.add("hidden");
    });
});

// Close dropdown if clicked outside
window.addEventListener("click", (e) => {
    if (!langBtn.contains(e.target) && !langDropdown.contains(e.target)) {
        langDropdown.classList.add("hidden");
    }
});

// < !--Language Selector Dropdown 2-- >
const langBtn2 = document.getElementById("lang-btn2");
const langDropdown2 = document.getElementById("lang-dropdown2");
const currentLang2 = document.getElementById("current-lang");

// Toggle dropdown
langBtn2.addEventListener("click", () => {
    langDropdown2.classList.toggle("hidden");
});

// Handle language selection
langDropdown2.querySelectorAll("button[data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => {
        currentLang2.textContent = btn.getAttribute("data-lang");
        langDropdown2.classList.add("hidden");
    });
});

// Close dropdown if clicked outside
window.addEventListener("click", (e) => {
    if (!langBtn2.contains(e.target) && !langDropdown2.contains(e.target)) {
        langDropdown2.classList.add("hidden");
    }
});
