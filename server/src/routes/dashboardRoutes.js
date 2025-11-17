// src/routes/dashboardRoutes.js
import express from "express";
import { getUserDashboard } from "../controllers/dashboardController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Only authenticated users can see dashboard
router.get("/", authMiddleware, getUserDashboard);

export default router;
