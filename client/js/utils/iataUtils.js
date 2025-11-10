// client/js/utils/iataUtils.js
// ----------------------------------
// Utility to map IATA codes → City/Airline Names (new structure optimized for O(1))
// ----------------------------------

let cityMap = {};
let airlineMap = {};
let dataLoaded = false;

// 🧩 Load and cache both mapping files
export async function loadIataData() {
    if (dataLoaded) return; // already loaded
    try {
        const [cityRes, airlineRes] = await Promise.all([
            fetch("/assets/data/IATAtoCITY.json"),
            fetch("/assets/data/IATAtoAIRLINE.json"),
        ]);

        if (!cityRes.ok || !airlineRes.ok)
            throw new Error("Failed to fetch IATA mapping data");

        cityMap = await cityRes.json();
        airlineMap = await airlineRes.json();
        dataLoaded = true;
        console.log("✅ IATA mapping loaded successfully");
    } catch (err) {
        console.error("❌ Error loading IATA data:", err);
    }
}

// 🏙️ Get City Name in format: "City (IATA)"
export function getCityName(iataCode) {
    if (!iataCode) return "";
    const entry = cityMap[iataCode.toUpperCase()];
    if (!entry) return iataCode.toUpperCase();
    const name = entry.city || entry.name || iataCode;
    return `${name} (${iataCode.toUpperCase()})`;
}

// ✈️ Get Airline Name in format: "Airline (IATA)"
export function getAirlineName(iataCode) {
    if (!iataCode) return "";
    const entry = airlineMap[iataCode.toUpperCase()];
    if (!entry) return iataCode.toUpperCase();
    const name = entry.airline || entry.name || iataCode;
    return `${name} (${iataCode.toUpperCase()})`;
}
