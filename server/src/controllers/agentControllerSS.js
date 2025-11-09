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

        const message = req.body.message;
        if (!message || typeof message !== "string") {
            return res.status(400).json({ success: false, message: "message is required" });
        }

        const memory = getUserContext(userId) || {};

        // 1️⃣ Unified prompt for Gemini
        const prompt = `
You are 'ELI', the AI assistant for EdgeFly - a flight search servive/engine.
You can chat naturally or perform flight searches.
Please make sure you include (success, flights, intent, message) in your response.

If the user greets or asks a question, respond conversationally (plain text).
If the user asks for flights, respond ONLY in valid JSON (no markdown, no extra words).

JSON schema:
{
  "intent": "search",
  "origin": "LON",
  "destination": "DXB",
  "departureDate": "YYYY-MM-DD",
  "returnDate": string | null,
  "travelClass": "ECONOMY" | "BUSINESS" | "FIRST" | "PREMIUM_ECONOMY",
  "passengers": number,
  "preferences": {
    "sort": "cheapest" | "shortest" | "best"
  },
  "followUp": string | null
}

If uncertain, set "intent": "error" and add a friendly "followUp".

Context: ${JSON.stringify(memory)}
User: ${message}
        `.trim();

        // 2️⃣ Ask Gemini safely
        console.log("🧠 Sending to Gemini:", message);
        const raw = await queryGeminiRaw(prompt, { maxTokens: 600 });
        console.log("🔮 Gemini raw reply:", raw);

        // 3️⃣ Extract JSON (if any) and clean text
        let parsed = null;
        let jsonBlock = null;
        const jsonMatch = raw && raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonBlock = jsonMatch[0];
            try {
                parsed = JSON.parse(jsonBlock);
            } catch (err) {
                console.warn("❗ Gemini JSON parse failed:", err.message);
                parsed = { intent: "error", followUp: "Sorry, I couldn’t understand that properly." };
            }
        }

        // Remove JSON from the visible message
        let textOnly = raw;
        if (jsonBlock) textOnly = raw.replace(jsonBlock, "").replace(/```(json)?/g, "").trim();
        if ((!textOnly || textOnly.length < 1) && parsed && (parsed.message || parsed.response)) {
            textOnly = parsed.message || parsed.response;
        }
        textOnly = (textOnly || "").trim();

        // 4️⃣ Handle intents
        if (parsed?.intent === "search") {
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

            // save user context + history
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

            // ✅ clean JSON-free message
            return res.json({
                success: true,
                message: textOnly || `Found ${flights?.length || 0} flights from ${originIATA} to ${destinationIATA}`,
                flights: flights || [],
                assistantIntent: "search",
            });
        }

        // 5️⃣ For error / follow-up intent
        if (parsed?.intent === "error" && parsed.followUp) {
            return res.json({
                success: true,
                message: parsed.followUp,
                assistantIntent: "error",
            });
        }

        // 6️⃣ Default: conversational Q/A
        return res.json({
            success: true,
            message: textOnly || raw,
            assistantIntent: parsed?.intent || "Q/A",
        });
    } catch (err) {
        console.error("ELI Fatal:", err);
        return res.status(500).json({
            success: false,
            message: "ELI internal error: " + err.message,
        });
    }
}

