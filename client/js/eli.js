// client/js/eli.js
import * as EdgeApi from "./api.js";

const openBtn = document.getElementById("open-eli");
const closeBtn = document.getElementById("close-eli");
const modal = document.getElementById("eli-modal");
const form = document.getElementById("eli-form");
const input = document.getElementById("eli-input");
const messages = document.getElementById("eli-messages");

function appendMessage(sender, text, isLink = false) {
    const wrap = document.createElement("div");
    wrap.className = `flex ${sender === "user" ? "justify-end" : "justify-start"} items-start gap-3`;

    const bubble = document.createElement("div");
    bubble.className =
        sender === "user"
            ? "bg-primary text-background-dark p-3 rounded-lg rounded-tr-none max-w-md"
            : "bg-primary/20 dark:bg-primary/30 p-3 rounded-lg rounded-tl-none max-w-md";

    bubble.innerHTML = isLink
        ? `<p class="text-sm">${text}</p>`
        : `<p class="text-sm text-background-dark dark:text-background-light">${text}</p>`;

    wrap.appendChild(bubble);
    messages.appendChild(wrap);
    messages.scrollTo({ top: messages.scrollHeight, behavior: "smooth" });
}

function greetUser() {
    const hasUsed = localStorage.getItem("edgefly_eli_used");
    const greeting = hasUsed
        ? "Welcome back! How can I assist with your next trip?"
        : "Hi there! I'm ELI — your personal flight assistant. How can I help you find the perfect flight today?";
    appendMessage("eli", greeting);
    localStorage.setItem("edgefly_eli_used", "true");
}

openBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
    if (!messages.hasChildNodes()) greetUser();
});

closeBtn.addEventListener("click", () => modal.classList.add("hidden"));

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    appendMessage("user", text);
    input.value = "";

    appendMessage("eli", "Thinking…");

    try {
        const isUser = !!EdgeApi.getToken();
        const res = isUser
            ? await EdgeApi.askAgentUser(text)
            : await EdgeApi.askAgentGuest(text);

        // remove "Thinking…" spinner element if present
        if (messages.lastElementChild) {
            messages.lastElementChild.remove();
        }

        // Normalize the response into { results, query, searchPayload } shape
        const normalized = { results: null, query: { message: text }, searchPayload: null };

        if (Array.isArray(res?.results)) normalized.results = res.results;
        else if (Array.isArray(res?.flights)) normalized.results = res.flights;
        else if (Array.isArray(res?.data?.flights)) normalized.results = res.data.flights;
        else if (Array.isArray(res)) normalized.results = res;

        if (res?.searchPayload) normalized.searchPayload = res.searchPayload;
        if (res?.payload) normalized.searchPayload = res.payload;
        if (res?.query) normalized.query = res.query;

        if (Array.isArray(normalized.results) && normalized.results.length) {
            const storeObj = {
                query: normalized.searchPayload || normalized.query || { message: text },
                results: normalized.results
            };
            try {
                localStorage.setItem("edgefly_search_results", JSON.stringify(storeObj));
            } catch (e) {
                console.warn("ELI: failed to write search results to localStorage", e);
            }

            appendMessage(
                "eli",
                `I found ${normalized.results.length} flight option${normalized.results.length > 1 ? "s" : ""} — you can view them by clicking the link below.`,
                true
            );

            const link = document.createElement("a");
            link.href = "../pages/search_results.html";
            link.textContent = "View Flights";
            link.className = "text-[#ffa200] underline mx-2";
            const lastMsg = messages.lastElementChild;
            if (lastMsg) {
                const p = lastMsg.querySelector("p") || lastMsg.appendChild(document.createElement("p"));
                p.appendChild(link);
            } else {
                const fallback = document.createElement("div");
                fallback.innerHTML = `<p><a href="../pages/search_results.html" class="text-[#ffa200] underline">View Flights →</a></p>`;
                messages.appendChild(fallback);
            }
        } else {
            appendMessage("eli", res?.message || "Sorry — I couldn't find any flights matching that query.");
        }
    } catch (err) {
        appendMessage("eli", "Sorry, something went wrong connecting to ELI.");
        console.error("ELI error:", err);
    }
});
