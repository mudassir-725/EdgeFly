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
// console.log("🔐 Amadeus Keys Check:", process.env.AMADEUS_CLIENT_ID, process.env.AMADEUS_CLIENT_SECRET);
console.log("🔑 Using Amadeus credentials:", {
    key: process.env.AMADEUS_CLIENT_ID ? "Loaded" : "Missing",
    secret: process.env.AMADEUS_CLIENT_SECRET ? "Loaded" : "Missing",
    env: "test"
});

// Search Flights
export async function searchFlights(origin, destination, departureDate, returnDate, adults = 1, travelClass = "ECONOMY") {
    try {
        console.log(`🚀 Searching flights from ${origin} → ${destination} (${departureDate}${returnDate ? " ↩ " + returnDate : ""})`);

        const response = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: origin,
            destinationLocationCode: destination,
            departureDate,
            ...(returnDate && { returnDate }),
            adults,
            travelClass,
            currencyCode: "USD",
            max: 20
        });

        const flights = response.data.map(flight => ({
            id: flight.id,
            airline: flight.validatingAirlineCodes?.[0],
            totalPrice: flight.price.total,
            currency: flight.price.currency,
            itineraries: flight.itineraries.map(itin => ({
                duration: itin.duration,
                segments: itin.segments.map(seg => ({
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
        console.error("❌ Amadeus flight search error (FULL DEBUG):", {
            message: err.message,
            name: err.name,
            responseData: err.response?.data,
            status: err.response?.status,
            stack: err.stack
        });

        // Also print raw error object for sandbox debugging
        console.error("🪶 Raw error object:", JSON.stringify(err, null, 2));

        throw new Error(
            err.response?.data?.errors?.[0]?.detail ||
            err.message ||
            "Amadeus API request failed."
        );
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
            city: loc.address.cityName,
            country: loc.address.countryName
        }));
    } catch (err) {
        console.error("❌ Amadeus autocomplete error:", err.response?.data || err.message);
        throw new Error("Failed to fetch airport suggestions.");
    }
}

export default { searchFlights, autocompleteAirport };
