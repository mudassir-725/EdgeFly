// src/routes/searchRoutes.js
import express from "express";
import { SearchHistory } from "../models/SearchHistory.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Get user search history
router.get("/history", authMiddleware, async (req, res) => {
    try {
        const history = await SearchHistory.findAll({
            where: { userId: req.user.id },
            order: [["createdAt", "DESC"]],
            limit: 10,
        });
        res.json({ success: true, history });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
