// server/src/services/geminiService.js
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
    process.env.GEMINI_API_URL ||
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-pro";

/**
 * Query Gemini API — simplified and stable
 */
export async function queryGeminiRaw(prompt, opts = {}) {
    try {
        const body = {
            model: GEMINI_MODEL,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: opts.temperature ?? 0.3,
                maxOutputTokens: opts.maxTokens ?? 512,
            },
        };

        const headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
        };

        const res = await axios.post(GEMINI_API_URL, body, { headers });

        const text =
            res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        if (!text) throw new Error("Empty Gemini response");
        return text;
    } catch (err) {
        console.error("GeminiRaw failed:", err.response?.data || err.message);
        throw new Error("Gemini API request failed: " + err.message);
    }
}
