// src/controllers/agentController.js
import dotenv from "dotenv";
import * as chrono from "chrono-node";
import { parseFlightQueryToJSON } from "../services/geminiService.js";
import { getUserContext, setUserContext } from "../utils/memoryStore.js";
import { searchFlights, autocompleteAirport } from "../services/amadeusService.js";
import { SearchHistory } from "../models/SearchHistory.js";

dotenv.config();

/**
 * POST /api/agent/query
 * Body: { message: "Find me flights to Paris next week" }
 * Requires authMiddleware (for userId)
 */

// Agent Query Handler
export async function handleAgentQuery(req, res) {
    try {
        const userId = req.user?.id;

        // UnAuth Access Handler
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Please log in to use EdgeAgent (ELI).",
            });
        }

        // const { message, context } = req.body;
        const message = req.body.message || req.body.query;
        const { context } = req.body;

        if (!message || typeof message !== "string") {
            return res.status(400).json({ success: false, message: "message is required" });
        }

        // === 1️⃣ Restore short-term memory (within 3 hours) ===
        const userMemory = getUserContext(userId);
        const mergedContext = {
            ...(userMemory || {}),
            lastMessage: message,
            ...(context || {}),
        };

        // === 2️⃣ Parse message via Gemini ===
        let parsed;
        try {
            parsed = await parseFlightQueryToJSON(message, mergedContext);
        } catch (err) {
            console.warn("Gemini parse fallback:", err.message);
            const dates = chrono.parse(message);
            const departureDate = dates[0]
                ? dates[0].start.date().toISOString().slice(0, 10)
                : null;
            parsed = {
                intent: "search",
                origin: null,
                destination: null,
                departureDate,
                returnDate: null,
                travelClass: "ECONOMY",
                passengers: 1,
                preferences: { sort: "cheapest" },
                followUp: null,
            };
        }

        // === 3️⃣ Normalize parsed output ===
        const normalizeParsedQuery = (p) => {
            const normalized = { ...p };
            if (!normalized.passengers) normalized.passengers = 1;
            if (!normalized.travelClass) normalized.travelClass = "ECONOMY";
            if (!normalized.preferences) normalized.preferences = { sort: "cheapest" };
            if (!normalized.preferences.sort) normalized.preferences.sort = "cheapest";

            // Detect dates from natural text
            if (!normalized.departureDate) {
                const chronoResult = chrono.parse(p.userMessage || message);
                if (chronoResult[0]?.start) {
                    normalized.departureDate = chronoResult[0].start
                        .date()
                        .toISOString()
                        .slice(0, 10);
                }
            }

            // Detect trip duration ("for 7 days")
            const durationMatch = (p.userMessage || message).match(
                /(\d+)\s*(day|days|night|nights|holiday|holidays)/i
            );
            if (durationMatch && normalized.departureDate && !normalized.returnDate) {
                const days = parseInt(durationMatch[1]);
                const depart = new Date(normalized.departureDate);
                const ret = new Date(depart.getTime() + days * 24 * 60 * 60 * 1000);
                normalized.returnDate = ret.toISOString().slice(0, 10);
            }

            return normalized;
        };

        parsed = normalizeParsedQuery(parsed);

        // === 4️⃣ Intent classification ===
        const normalizeIntent = (intent) => {
            if (!intent) return null;
            const i = intent.toLowerCase().trim();
            if (
                ["search", "flight_search", "find_flights"].includes(i) ||
                i.includes("flight") ||
                i.includes("search")
            )
                return "search";
            return i;
        };

        const intent = normalizeIntent(parsed.intent);

        // === 5️⃣ Save conversational context (for continuity) ===
        setUserContext(userId, {
            lastOrigin: parsed.origin,
            lastDestination: parsed.destination,
            lastTravelClass: parsed.travelClass,
            lastPassengers: parsed.passengers,
            lastDates: {
                departure: parsed.departureDate,
                return: parsed.returnDate,
            },
            timestamp: Date.now(),
        });

        // === 6️⃣ Handle follow-up questions (needs clarification) ===
        if (parsed.followUp) {
            return res.json({
                success: true,
                needsClarification: true,
                followUp: parsed.followUp,
                parsed,
            });
        }

        // === 7️⃣ Non-search intent? ===
        // if (intent !== "search") {
        //     return res.json({
        //         success: true,
        //         message: "EdgeAgent response",
        //         assistantIntent: parsed.intent,
        //         assistantOutput: parsed,
        //     });
        // }

        if (intent !== "search") {
            const textResponse = parsed.followUp
                ? parsed.followUp
                : `Here’s what I found: ${parsed.intent || "general conversation"}`;
            return res.json({
                success: true,
                message: textResponse,
                assistantIntent: parsed.intent,
                assistantOutput: parsed,
            });
        }


        // === 8️⃣ Convert city names → IATA codes ===
        const ensureIATA = async (loc) => {
            if (!loc) return null;
            if (/^[A-Z]{3}$/.test(loc)) return loc;
            try {
                const suggest = await autocompleteAirport(loc);
                if (suggest?.length) return suggest[0].code || loc;
                return loc;
            } catch {
                return loc;
            }
        };

        const originIATA = await ensureIATA(parsed.origin);
        const destinationIATA = await ensureIATA(parsed.destination);

        // === 9️⃣ Call Amadeus ===
        const flights = await searchFlights(
            originIATA || parsed.origin,
            destinationIATA || parsed.destination,
            parsed.departureDate,
            parsed.returnDate,
            parsed.passengers,
            parsed.travelClass
        );

        // === 🔟 Save search history (persistent memory) ===
        await SearchHistory.create({
            userId,
            origin: originIATA,
            destination: destinationIATA,
            departureDate: parsed.departureDate,
            returnDate: parsed.returnDate,
            travelClass: parsed.travelClass,
            passengers: parsed.passengers,
        });

        // === ✅ Respond (normalized, consistent output) ===
        try {
            const resultMessage = "EdgeAgent search results";
            let flightsDetected = null;
            const match = typeof resultMessage === "string" ? resultMessage.match(/\[.*\]/s) : null;
            if (match) {
                try {
                    flightsDetected = JSON.parse(match[0]);
                } catch (err) {
                    console.warn("Failed to parse flights JSON:", err);
                }
            }

            return res.json({
                success: true,
                message: resultMessage,
                flights: flightsDetected || flights || [],
            });
        } catch (error) {
            console.error("EdgeAgent failed:", error);
            res.status(500).json({
                success: false,
                message: "ELI encountered an error: " + error.message,
            });
        }

    } catch (err) {
        console.error("EdgeAgent error:", err);
        return res.status(500).json({ success: false, message: "EdgeAgent failed! Please retry shortly!" });
    }

}
