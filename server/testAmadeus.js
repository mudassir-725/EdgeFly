// server/testAmadeus.js
import Amadeus from "amadeus";
import dotenv from "dotenv";
dotenv.config();

const amadeus = new Amadeus({
    clientId: process.env.AMADEUS_CLIENT_ID,
    clientSecret: process.env.AMADEUS_CLIENT_SECRET,
    environment: "test"
});

async function run() {
    try {
        console.log("Getting token via SDK (this happens internally)...");
        // Simple search - one-way then return leg
        const res = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: "JFK",
            destinationLocationCode: "LHR",
            departureDate: "2025-11-19",
            returnDate: "2025-11-25",
            adults: 1,
            travelClass: "ECONOMY",
            currencyCode: "USD",
            max: 5
        });

        console.log("OK - response status:", res.status || "unknown");
        console.log("Data length:", Array.isArray(res.data) ? res.data.length : "n/a");
        console.log(JSON.stringify(res.data?.[0], null, 2));
    } catch (err) {
        console.error("ERROR from SDK call:");
        console.error("message:", err?.message);
        console.error("status:", err?.response?.status);
        console.error("response.data:", JSON.stringify(err?.response?.data, null, 2));
        // print ama gateway id if present
        console.error("Ama-Gateway-Request-Id:", err?.response?.headers?.["ama-gateway-request-id"] || err?.response?.headers?.["Ama-Gateway-Request-Id"]);
        console.error("FULL err object keys:", Object.getOwnPropertyNames(err));
        process.exit(1);
    }
}

run();
