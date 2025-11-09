// src/controllers/flightController.js
import { searchFlights, autocompleteAirport } from "../services/amadeusService.js";
import { SearchHistory } from "../models/SearchHistory.js";

// ✈️ Flight search (User or Guest)
export const getFlights = async (req, res) => {
    try {

        // Extract parameters from body (since this is a POST request)
        const {
            origin,
            destination,
            departureDate,
            returnDate = null,
            passengers = 1,
            travelClass = "ECONOMY",
        } = req.body;

        // 🧾 Validate input
        if (!origin || !destination || !departureDate) {
            return res.status(400).json({ success: false, message: "Missing required parameters." });
        }

        // 🔍 Query Amadeus API
        const results = await searchFlights(
            origin,
            destination,
            departureDate,
            returnDate,
            passengers,
            travelClass
        );

        // 🧩 Handle missing or empty data safely
        if (!results) {
            console.warn("⚠️ No results returned from Amadeus service.");
            return res
                .status(502)
                .json({ success: false, message: "No response from flight data service." });
        }

        if (!Array.isArray(results) || results.length === 0) {
            console.log("❕ No flights found for given parameters.");
            return res
                .status(404)
                .json({ success: false, message: "No flights found for this route/date." });
        }

        // 🧾 Save search to history (only if logged in)
        if (req.user?.id) {
            await SearchHistory.create({
                userId: req.user.id,
                origin,
                destination,
                departureDate,
                returnDate,
                travelClass,
                passengers,
            });
        }
        else {
            await SearchHistory.create({
                userId: 0,
                origin,
                destination,
                departureDate,
                returnDate,
                travelClass,
                passengers,
            });
        }

        console.log(`🛫 Returning ${results.length} flights.`);
        return res.status(200).json({ success: true, results });
    } catch (err) {
        console.error("❌ Flight search error:", err);
        return res.status(500).json({ success: false, message: err.message || "Internal server error." });
    }
};

// 🔍 Airport autocomplete
export const getAutocomplete = async (req, res) => {
    try {
        const { keyword } = req.query;
        if (!keyword) return res.status(400).json({ success: false, message: "Keyword is required." });

        const results = await autocompleteAirport(keyword);
        if (!results?.length) return res.status(404).json({ success: false, message: "No airports found." });

        return res.status(200).json({ success: true, results });
    } catch (err) {
        console.error("❌ Autocomplete error:", err);
        return res.status(500).json({ success: false, message: err.message || "Internal server error." });
    }
};
