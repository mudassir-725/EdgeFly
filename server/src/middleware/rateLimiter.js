// src/middleware/rateLimiter.js
import rateLimit from "express-rate-limit";

// Apply per authenticated user or IP
const agentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // max 10 queries per window
    message: {
        success: false,
        message: "Too many requests to EdgeAgent. Please wait a few minutes. And, Only 1 Query/Minute!"
    },
    standardHeaders: true,
    legacyHeaders: false
});

export default agentLimiter;
