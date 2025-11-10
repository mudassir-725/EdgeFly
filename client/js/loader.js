// client/js/loader.js
// ✨ EdgeFly Loader System v3.7
// Fully manual control — shows loader until explicitly hidden
// Supports: "circle", "bars", "squares"

let activeTimer = null;
let loaderVisible = false;

/**
 * Show loader overlay
 * @param {string} message
 * @param {"circle"|"bars"|"squares"} type
 * @param {number} duration Optional — if > 0, auto-hide after (ms)
 * @param {string} color
 */
export function showLoader(message = "Loading…", type = "circle", duration = 0, color = "#FFBB00") {
    hideLoader(); // clear previous

    let loader = document.getElementById("edgefly-loader");
    if (!loader) {
        loader = document.createElement("div");
        loader.id = "edgefly-loader";
        document.body.appendChild(loader);
    }

    loader.innerHTML = `
    <div class="loader-overlay">
      ${getLoaderGraphic(type, color)}
      <p class="loader-text">${message}</p>
    </div>
  `;

    loader.style.display = "flex";
    requestAnimationFrame(() => loader.classList.add("visible"));
    loaderVisible = true;

    if (duration && duration > 0) {
        activeTimer = setTimeout(() => hideLoader(), duration);
    }
}

/**
 * Hide loader overlay
 */
export function hideLoader() {
    clearTimeout(activeTimer);
    const loader = document.getElementById("edgefly-loader");
    if (loader && loaderVisible) {
        loader.classList.remove("visible");
        loaderVisible = false;
        setTimeout(() => (loader.style.display = "none"), 300);
    }
}

/**
 * Utility to ensure loader stays until a promise completes.
 * Example: await withLoader(showLoader("...", "squares"), asyncFn());
 */
export async function withLoader(message, type, color, fn) {
    showLoader(message, type, 0, color);
    try {
        const result = await fn();
        return result;
    } finally {
        hideLoader();
    }
}

/**
 * Loader markup generator
 */
function getLoaderGraphic(type, color) {
    switch (type) {
        case "squares":
            return `
        <div class="loader squares">
          <span class="square" style="background-color:${color}"></span>
          <span class="square" style="background-color:${color}"></span>
          <span class="square" style="background-color:${color}"></span>
          <span class="square" style="background-color:${color}"></span>
        </div>`;
        case "bars":
            return `
        <div class="loader bars">
          <span class="col" style="background-color:${color}"></span>
          <span class="col" style="background-color:${color}"></span>
          <span class="col" style="background-color:${color}"></span>
          <span class="col" style="background-color:${color}"></span>
          <span class="col" style="background-color:${color}"></span>
        </div>`;
        case "circle":
        default:
            return `
        <div class="loader circle">
          <span class="ball" style="background-color:${color}"></span>
          <span class="ball" style="background-color:${color}"></span>
          <span class="ball" style="background-color:${color}"></span>
          <span class="ball" style="background-color:${color}"></span>
        </div>`;
    }
}
