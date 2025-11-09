// client/js/utils/iataUtils.js
// client/js/utils/iataUtils.js
// ----------------------------------
// Utility to map IATA codes → City/Airline Names
// ----------------------------------

let cityMap = {};
let airlineMap = {};
let dataLoaded = false;

// 🧩 Load and cache both mapping files
export async function loadIataData() {
    if (dataLoaded) return; // already loaded
    try {
        const [cityRes, airlineRes] = await Promise.all([
            fetch("../../server/assets/data/IATAtoCITY.JSON"),
            fetch("../../server/assets/data/IATAtoAIRLINE.JSON"),
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
    const city = cityMap[iataCode.toUpperCase()];
    return city ? `${city} (${iataCode.toUpperCase()})` : iataCode;
}

// ✈️ Get Airline Name in format: "Airline (IATA)"
export function getAirlineName(iataCode) {
    if (!iataCode) return "";
    const airline = airlineMap[iataCode.toUpperCase()];
    return airline ? `${airline} (${iataCode.toUpperCase()})` : iataCode;
}
