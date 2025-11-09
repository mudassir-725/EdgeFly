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
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Please log in to use ELI.",
            });
        }

        const message = req.body.message || req.body.query;
        if (!message || typeof message !== "string") {
            return res.status(400).json({ success: false, message: "message is required" });
        }

        // 1️⃣ Restore user memory
        const memory = getUserContext(userId) || {};

        // 2️⃣ Unified prompt — Gemini handles both Q/A and search
        const systemPrompt = `
You are 'ELI', the AI assistant for EdgeFly. 
Your job is to answer questions about flights or EdgeFly, 
and when the user asks for a flight search, return a proper JSON as shown.

If the user's message is a general question or greeting → respond in natural text.
If the user's message is a flight search → respond only with valid JSON.

JSON format:
{
  "intent": "search",
  "origin": string,
  "destination": string,
  "departureDate": string (YYYY-MM-DD),
  "returnDate": string | null,
  "travelClass": "ECONOMY" | "BUSINESS" | "FIRST" | "PREMIUM_ECONOMY",
  "passengers": number,
  "preferences": {
    "sort": "cheapest" | "shortest" | "best",
    "maxPrice": number,
    "airlines": string[]
  },
  "followUp": string | null
}

If you are not sure, set "intent": "error" and give a friendly "followUp" question.

Context: ${JSON.stringify(memory)}
User: ${message}
`.trim();

        // 3️⃣ Ask Gemini
        console.log("🧠 Sending to Gemini:", message);

        // const raw = await queryGeminiRaw(systemPrompt, { maxTokens: 600 });
        const raw = await queryGeminiRaw(systemPrompt, message, { maxTokens: 600 });
        let parsed;

        console.log("🔮 Gemini raw reply:", raw);

        // 4️⃣ Detect if Gemini responded with JSON or text
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            let parsed = null;
            try {
                const jsonMatch = raw.match(/\{[\s\S]*\}/);
                if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
            } catch (err) {
                console.warn("JSON parse failed:", err.message);
                parsed = { intent: "error", followUp: "Sorry, I couldn’t process that properly." };
            }
        }


        // 5️⃣ If JSON intent: search → proceed with flight search
        if (parsed?.intent?.toLowerCase() === "search") {
            const ensureIATA = async (loc) => {
                if (!loc) return null;
                if (/^[A-Z]{3}$/.test(loc)) return loc;
                try {
                    const suggest = await autocompleteAirport(loc);
                    return suggest?.[0]?.code || loc;
                } catch {
                    return loc;
                }
            };

            const originIATA = await ensureIATA(parsed.origin);
            const destinationIATA = await ensureIATA(parsed.destination);

            const flights = await searchFlights(
                originIATA,
                destinationIATA,
                parsed.departureDate,
                parsed.returnDate,
                parsed.passengers,
                parsed.travelClass
            );

            // Save memory and history
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

            await SearchHistory.create({
                userId,
                origin: originIATA,
                destination: destinationIATA,
                departureDate: parsed.departureDate,
                returnDate: parsed.returnDate,
                travelClass: parsed.travelClass,
                passengers: parsed.passengers,
            });

            return res.json({
                success: true,
                message: `Found ${flights?.length || 0} flights from ${originIATA} to ${destinationIATA}`,
                flights: flights || [],
                assistantIntent: "search",
            });
        }

        // 6️⃣ If follow-up requested
        if (parsed?.intent === "error" && parsed.followUp) {
            return res.json({
                success: true,
                message: parsed.followUp,
                assistantIntent: "error",
            });
        }

        // 7️⃣ Otherwise it's a Q/A or chat message — just return text
        return res.json({
            success: true,
            message: parsed?.followUp || raw,
            assistantIntent: parsed?.intent || "Q/A",
        });
    } catch (err) {
        console.error("EdgeAgent fatal:", err);
        return res.status(500).json({
            success: false,
            message: "ELI internal error: " + err.message,
        });
    }
}
