// src/app.js
import express from "express";
import cors from "cors";

// Routes
import flightRoutes from "./routes/flightRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";

// Middleware
import { requestLogger } from "./middleware/logging.js";

const app = express();

// Core middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use(requestLogger);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/recommendations", recommendationRoutes);

// Health check
app.get("/", (req, res) => {
    res.send("EdgeFly backend is alive 🌍");
});

export default app;
