// server/src/routes/agentRoutes.js
import express from "express";
import { handleAgentQuery } from "../controllers/agentController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import agentLimiter from "../middleware/rateLimiter.js";

const router = express.Router();

// Protected: Only authenticated users can access EdgeAgent, with rate limiting
router.post("/query", authMiddleware, agentLimiter, handleAgentQuery);

router.post("/guest", agentLimiter, handleAgentQuery); // No authMiddleware here

// router.post("/query", agentController.askAgentUser);
// router.post("/guest", agentController.askAgentGuest);

export default router;