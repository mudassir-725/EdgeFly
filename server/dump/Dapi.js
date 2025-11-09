// Client/js/api.js
const API_BASE = "http://localhost:5000/api";

export async function searchFlights(params) {
    const response = await fetch(`${API_BASE}/flights/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
    });
    return response.json();
}

export async function askEdgeAgent(query) {
    const response = await fetch(`${API_BASE}/assistant/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
    });
    return response.json();
}
