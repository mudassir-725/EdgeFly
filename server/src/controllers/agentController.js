// server/src/controllers/agentController.js
import dotenv from "dotenv";
import { queryGeminiRaw } from "../services/geminiService.js";
import { getUserContext, setUserContext } from "../utils/memoryStore.js";
import { searchFlights, autocompleteAirport } from "../services/amadeusService.js";
import { SearchHistory } from "../models/SearchHistory.js";

dotenv.config();

export async function handleAgentQuery(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Please log in to use ELI." });
        }

        const message = req.body.message;
        if (!message || typeof message !== "string") {
            return res.status(400).json({ success: false, message: "message is required" });
        }

        const memory = getUserContext(userId) || {};

        const prompt = `
You are 'ELI', the AI assistant for EdgeFly - a flight search service.
If user asks for flights, respond ONLY with JSON that matches this schema:
{
  "intent": "search",
  "origin": "XXX"(IATA Code) || "City Name"(Any City Name; Make sure you convert the city name into the respective IATA Code before searching/giving it to other API),
  "destination": "YYY" (IATA Code) || "City Name"(Any City Name; Make sure you convert the city name into the respective IATA Code before searching/giving it to other API)
  "departureDate": "YYYY-MM-DD"(Somthimes you need to parse/extract the dates from the users message - e.g., “next Friday”, “tomorrow”, etc,.),
  "returnDate": "YYYY-MM-DD" || null(For one way flight searchs),
  "travelClass": "ECONOMY" || "BUSINESS" || "FIRST",
  "passengers": 1(Max 9),
  "preferences": { "sort": "best" }
}
Otherwise, reply conversationally(You can include a followUp here!).
Context: ${JSON.stringify(memory)}
User: ${message}
        `.trim();

        console.log("🧠 Sending to Gemini:", message);
        const raw = await queryGeminiRaw(prompt, { maxTokens: 600 });
        console.log("🔮 Gemini raw reply:", raw);

        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return res.json({
                success: true,
                message: raw || "I didn’t find any flights for that.",
                assistantIntent: "Q/A",
            });
        }

        let parsed;
        try {
            parsed = JSON.parse(jsonMatch[0]);
        } catch {
            return res.json({
                success: true,
                message: "Sorry, I couldn’t understand that request.",
                assistantIntent: "error",
            });
        }

        // 🟢 Flight search handling
        if (parsed.intent?.toLowerCase() === "search") {
            const ensureIATA = async (loc) => {
                if (!loc) return null;
                if (/^[A-Z]{3}$/.test(loc)) return loc;
                const suggest = await autocompleteAirport(loc);
                return suggest?.[0]?.code || loc;
            };

            const originIATA = await ensureIATA(parsed.origin);
            const destinationIATA = await ensureIATA(parsed.destination);

            const flights = await searchFlights(
                originIATA,
                destinationIATA,
                parsed.departureDate,
                parsed.returnDate,
                parsed.passengers || 1,
                parsed.travelClass || "ECONOMY"
            );

            // Save context + history
            setUserContext(userId, {
                lastOrigin: originIATA,
                lastDestination: destinationIATA,
                lastTravelClass: parsed.travelClass,
                lastPassengers: parsed.passengers,
                lastDates: { departure: parsed.departureDate, return: parsed.returnDate },
            });

            await SearchHistory.create({
                userId,
                origin: originIATA,
                destination: destinationIATA,
                departureDate: parsed.departureDate,
                returnDate: parsed.returnDate,
                travelClass: parsed.travelClass,
                passengers: parsed.passengers,
            });

            const searchPayload = {
                query: {
                    origin: originIATA,
                    destination: destinationIATA,
                    departureDate: parsed.departureDate,
                    returnDate: parsed.returnDate,
                    passengers: parsed.passengers || 1,
                    travelClass: parsed.travelClass || "ECONOMY",
                },
                results: flights || [],
            };

            return res.json({
                success: true,
                message: `Found ${flights.length} flights from ${originIATA} to ${destinationIATA}.`,
                assistantIntent: "search",
                flights,
                searchPayload,
            });
        }

        // Default conversational fallback
        return res.json({
            success: true,
            message: raw,
            assistantIntent: "Q/A",
        });
    } catch (err) {
        console.error("ELI Fatal:", err);
        return res.status(500).json({
            success: false,
            message: "ELI internal error: " + err.message,
        });
    }
}
