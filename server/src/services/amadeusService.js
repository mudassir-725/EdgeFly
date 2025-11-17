// src/services/amadeusService.js
import Amadeus from "amadeus";
import dotenv from "dotenv";
dotenv.config();

// 🧠 Explicitly force sandbox endpoint for test credentials
const amadeus = new Amadeus({
    clientId: process.env.AMADEUS_CLIENT_ID,
    clientSecret: process.env.AMADEUS_CLIENT_SECRET,
    environment: "test" // ✅ sandbox endpoint works
});

// Debugging key load
console.log("🔐 Amadeus Keys Check:", process.env.AMADEUS_CLIENT_ID ? "[loaded]" : "[missing]", process.env.AMADEUS_CLIENT_SECRET ? "[loaded]" : "[missing]");
console.log("🔑 Using Amadeus credentials:", {
    key: process.env.AMADEUS_CLIENT_ID ? "Loaded" : "Missing",
    secret: process.env.AMADEUS_CLIENT_SECRET ? "Loaded" : "Missing",
    env: "test"
});

// Simple retry helper (async fn, attempts, delay in ms)
async function retry(fn, attempts = 3, delay = 500) {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (err) {
            lastErr = err;
            // If this is not a server error (5xx) then don't retry
            const status = err?.response?.status || err?.status;
            if (!status || Math.floor(status / 100) !== 5) break;
            const backoff = delay * Math.pow(2, i);
            console.warn(`Retry ${i + 1}/${attempts} after ${backoff}ms due to server error (status ${status}).`);
            await new Promise(res => setTimeout(res, backoff));
        }
    }
    throw lastErr;
}

export async function searchFlights(origin, destination, departureDate, returnDate, adults = 1, travelClass = "ECONOMY") {
    try {
        console.log(`🚀 Searching flights from ${origin} → ${destination} (${departureDate}${returnDate ? " ↩ " + returnDate : ""})`);

        const call = () => amadeus.shopping.flightOffersSearch.get({
            originLocationCode: origin,
            destinationLocationCode: destination,
            departureDate,
            ...(returnDate && { returnDate }),
            adults,
            travelClass,
            currencyCode: "USD",
            max: 20
        });

        const response = await retry(call, 3, 600);

        const flights = (response.data || []).map(flight => ({
            id: flight.id,
            airline: flight.validatingAirlineCodes?.[0],
            totalPrice: flight.price?.total,
            currency: flight.price?.currency,
            itineraries: flight.itineraries?.map(itin => ({
                duration: itin.duration,
                segments: itin.segments?.map(seg => ({
                    departure: seg.departure,
                    arrival: seg.arrival,
                    carrierCode: seg.carrierCode,
                    number: seg.number,
                    duration: seg.duration
                }))
            }))
        }));

        console.log(`✈️ Found ${flights.length} flights`);
        return flights;

    } catch (err) {
        // Detailed logging
        console.error("❌ Amadeus flight search error (FULL DEBUG):", {
            message: err?.message,
            name: err?.name,
            status: err?.response?.status || err?.status,
            responseData: err?.response?.data || err?.result || null,
        });

        // Also print raw error object (stringify with fallback)
        try {
            console.error("🪶 Raw error object:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
        } catch (e) {
            console.error("🪶 Raw error object (alt):", err);
        }

        // If Amadeus is returning server_error, give a clearer message for client:
        const serverErr = err?.response?.data || err?.result;
        if (serverErr && (serverErr.error === "server_error" || err?.response?.status >= 500)) {
            throw new Error("Amadeus service temporarily unavailable (server error). Please try again later.");
        }

        throw new Error(err?.response?.data?.errors?.[0]?.detail || err?.message || "Amadeus API request failed.");
    }
}

// Autocomplete Airport
export async function autocompleteAirport(keyword) {
    try {
        const response = await amadeus.referenceData.locations.get({
            keyword,
            subType: Amadeus.location.any,
            page: { limit: 5 }
        });

        return response.data.map(loc => ({
            code: loc.iataCode,
            name: loc.name,
            city: loc.address?.cityName,
            country: loc.address?.countryName
        }));
    } catch (err) {
        console.error("❌ Amadeus autocomplete error:", err?.response?.data || err?.message);
        throw new Error("Failed to fetch airport suggestions.");
    }
}

export default { searchFlights, autocompleteAirport };
