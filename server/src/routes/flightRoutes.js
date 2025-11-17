// src/routes/flightRoutes.js
import express from "express";
import { getFlights, getAutocomplete } from "../controllers/flightController.js";
import amadeus from "../services/amadeusService.js";
// import { searchFlights, autocompleteAirport } from "../services/amadeusService.js";

const router = express.Router();

// Flight search
router.post("/", getFlights);
router.post("/guest", getFlights); // no auth, public access

// Fetch flight offers (flight data)
router.get("/test", async (req, res) => {
    try {
        const response = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: "LHR",
            destinationLocationCode: "DXB",
            departureDate: "2025-11-29",
            adults: 1
        });
        res.json({ success: true, data: response.data.slice(0, 2) });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Token or flight fetch failed",
            details: err.response?.data || err.message
        });
    }
});

// Airport autocomplete
router.get("/autocomplete", getAutocomplete);

export default router;
