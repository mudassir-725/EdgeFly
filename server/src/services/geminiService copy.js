// src/services/geminiService.js
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = process.env.GEMINI_API_URL;
const GEMINI_MODEL = process.env.GEMINI_MODEL;

if (!GEMINI_API_KEY || !GEMINI_API_URL) {
    console.warn("⚠️ GEMINI_API_KEY or GEMINI_API_URL not set. EdgeAgent will not function until provided.");
}

/**
 * Query the Gemini (or generic GenAI) endpoint.
 * The exact request body depends on your provider's API. This implementation expects:
 *  - A JSON POST with { model, prompt, ... } OR { prompt: { text }, ... } depending on endpoint.
 * You can edit the request construction to match the provider.
 */


export async function queryGemini(prompt, context = {}) {
    const model = getGeminiModel(); // your existing call
    const fullPrompt = context?.history
        ? `${context.history.join("\n")}\nUser: ${prompt}`
        : prompt;

    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();

    // Remove markdown-style formatting
    return response
        .replace(/```(json)?/g, "")
        .replace(/\n{2,}/g, "\n")
        .trim();
}

// ADD THIS FUNCTION near top or before parseFlightQueryToJSON
// async function queryGeminiRaw(prompt, opts = {}) {
//     try {
//         const body = {
//             model: GEMINI_MODEL || "gemini-1.5-pro",
//             contents: [{ role: "user", parts: [{ text: prompt }] }],
//             ...opts
//         };
//         const headers = {
//             "Content-Type": "application/json",
//             "x-goog-api-key": GEMINI_API_KEY
//         };
//         const res = await axios.post(GEMINI_API_URL, body, { headers });
//         const raw = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
//         return raw.trim();
//     } catch (err) {
//         console.error("GeminiRaw failed:", err.response?.data || err.message);
//         throw new Error("Gemini API request failed.");
//     }
// }

// export async function queryGeminiRaw(prompt, opts = {}) {
//     try {
//         const body = {
//             model: GEMINI_MODEL || "gemini-2.0-flash",
//             contents: [{ role: "user", parts: [{ text: prompt }] }],
//             ...opts
//         };

//         const headers = {
//             "Content-Type": "application/json",
//             "x-goog-api-key": GEMINI_API_KEY
//         };

//         const res = await axios.post(GEMINI_API_URL, body, { headers });
//         const raw =
//             res.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
//             res.data?.candidates?.[0]?.content?.parts?.[0]?.data ||
//             "";

//         if (!raw) throw new Error("Gemini returned no text output.");
//         return String(raw).trim();
//     } catch (err) {
//         console.error("GeminiRaw failed:", err.response?.data || err.message);
//         throw new Error("Gemini API request failed: " + err.message);
//     }
// }

export async function queryGeminiRaw(systemPrompt, userMessage, opts = {}) {
    try {
        const body = {
            model: GEMINI_MODEL || "gemini-1.5-pro",
            contents: [
                { role: "system", parts: [{ text: systemPrompt }] },
                { role: "user", parts: [{ text: userMessage }] }
            ],
            generationConfig: {
                temperature: opts.temperature ?? 0.3,
                maxOutputTokens: opts.maxTokens ?? 512
            }
        };

        const headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY
        };

        const res = await axios.post(GEMINI_API_URL, body, { headers });
        const raw =
            res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

        if (!raw) throw new Error("Empty Gemini response");
        return raw;
    } catch (err) {
        console.error("GeminiRaw failed:", err.response?.data || err.message);
        throw new Error("Gemini API request failed: " + err.message);
    }
}

/**
 * Parse user text into structured flight JSON
 */
// export async function parseFlightQueryToJSON(userMessage, userContext = {}) {
//     const systemPrompt = `You are EdgeAgent named 'ELI', the conversational flight consultant/assistant for EdgeFly. 
// Your role is to interpret user travel requests and respond ONLY with valid JSON. Also you can answer the Q/A from users on behalf of EdgeFly as an assistant/consultant.

// Context:
// - You remember the user’s recent searches for up to 3 hours (short-term memory) to provide natural, contextual answers.
// - You behave like a professional, concise flight assistant: clear, polite, compact/completeness and helpful.

// Task:
// Convert natural-language travel queries into a structured JSON object that EdgeFly’s backend can use for flight search.

// Rules:
// 0. I are built by the EdgeFly team to assist you with your flight searching needs; You are ELI, the conversational flight consultant/assistant for EdgeFly. You here to help users with flight searches and answer any questions they have about EdgeFly
// 1. When a user asks for flight search, Always respond the flights with valid JSON (no markdown, no text outside braces, no plain text for the search results) Below is the example format you can refer, and make sure the objects are parseable.
// 2. If essential details (origin, destination, dates, travel class, passengers) are missing, fill in what you can and include a "followUp" field with a clarification question.
// 3. If the request is ambiguous or invalid, respond with "intent": "error" and an explanatory "followUp" message.
// 4. When interpreting time expressions (e.g., “next Friday”, “tomorrow”, etc,.), convert them into explicit YYYY-MM-DD format using the current date context also get current date from your knowledge.
// 5. Do not guess numeric values unless clearly stated. Use '' for unknown fields.
// 6. Please, parse the given message for identifing the dates and day or time and don't just take the date input as 'YYYY-MM-DD' or 'YYYY/MM/DD' OR 'DD/MM/YYYY' OR 'DD/MM/YYYY' accept all forms and perform the accurate parsing ex: '05 Nov' or '21 December' etc,.
// 7. You can also identify the preferences of the user and add them.
// 8. If user asks for just one way flight, give him result, and don't ask for return flight as a follow up.
// 9. User's can also have a causual chat with you!

// JSON Output Schema:
// {
//   "intent": string,  // "Q/A", "search", "error", etc.
//   "origin": string | ,  // City and IATA
//   "destination": string | , // City and IATA
//   "departureDate": string(default today, tomorrow) | ,  // YYYY-MM-DD
//   "returnDate": string(default tomorrow, next days) | ,     // YYYY-MM-DD
//   "travelClass": "ECONOMY"(default) | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST",
//   "passengers": integer,  // 1–9 (default 1)
//   "preferences": {
//     "sort": "cheapest" | "shortest" | "best" ,
//     "maxPrice": number | default 50000,
//     "airlines": string[] | 
//   },
//   "followUp": string | 
// }

// Goal:
// Be conversational and efficient. If context implies prior choices (“same destination”, “again”, “like last time”), maintain consistency with remembered context.`.trim();

//     const userPrompt = `
// System: ${systemPrompt}
// User: ${userMessage}
// Context: ${JSON.stringify(userContext || {})}
//   `.trim();

//     const raw = await queryGeminiRaw(userPrompt, { maxTokens: 400, temperature: 0.0 });

//     // 🧹 Sanitize and parse safely
//     let clean = raw.replace(/```json|```/g, "").trim();
//     try {
//         return JSON.parse(clean);
//     } catch (err) {
//         console.error("EdgeAgent parse error – raw response:", raw);
//         throw new Error("EdgeAgent failed to parse user query into JSON. Raw response logged server-side.");
//     }
// }

export async function parseFlightQueryToJSON(userMessage, userContext = {}) {
    const systemPrompt = `
You are 'ELI', the AI travel consultant for EdgeFly.
You can chat naturally, answer travel-related questions, and also perform flight searches.
You must decide automatically whether the user’s message is:
 - a flight search (intent = "search"),
 - a normal question or greeting (intent = "Q/A"),
 - or unclear (intent = "error").

If intent = "search", respond **only with valid JSON**, matching this schema exactly (no markdown, no preamble, no explanations):

{
  "intent": "search",
  "origin": string,
  "destination": string,
  "departureDate": string (YYYY-MM-DD),
  "returnDate": string | null,
  "travelClass": "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST",
  "passengers": number,
  "preferences": {
    "sort": "cheapest" | "shortest" | "best",
    "maxPrice": number,
    "airlines": string[]
  },
  "followUp": string | null
}

If intent = "Q/A" or general chat, respond with clear, concise text — **no JSON at all.**
If intent = "error", return a friendly clarification message.

Context: ${JSON.stringify(userContext || {})}
User message: ${userMessage}
`.trim();

    // const raw = await queryGeminiRaw(systemPrompt, { maxTokens: 600, temperature: 0.3 });
    const raw = await queryGeminiRaw(systemPrompt, message, { maxTokens: 600, temperature: 0.3 });


    // Clean up any code fences or extra formatting
    const clean = raw.replace(/```(json)?/g, "").trim();

    // If it's JSON, parse it
    if (clean.startsWith("{") || clean.includes('"intent"')) {
        try {
            return JSON.parse(clean);
        } catch (err) {
            console.warn("ELI: JSON parse fallback triggered:", err.message);
            return { intent: "error", followUp: "Sorry, I couldn’t parse that request properly." };
        }
    }

    // Otherwise, treat as normal Q/A response
    return { intent: "Q/A", response: clean };
}
