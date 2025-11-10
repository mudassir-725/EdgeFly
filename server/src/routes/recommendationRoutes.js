// src/routes/recommendationRoutes.js
import express from "express";
import { getRecommendations } from "../controllers/recommendationController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected route
router.get("/", authMiddleware, getRecommendations);

export default router;
