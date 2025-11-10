// src/routes/wishlistRoutes.js
import express from "express";
import Wishlist from "../models/wishlistModel.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
    const { flight } = req.body;
    const userId = req.user.id;
    const item = await Wishlist.create({ userId, ...flight });
    res.json({ success: true, item });
});

router.get("/", authMiddleware, async (req, res) => {
    const items = await Wishlist.findAll({ where: { userId: req.user.id } });
    res.json({ success: true, items });
});

router.delete("/:id", authMiddleware, async (req, res) => {
    await Wishlist.destroy({ where: { id: req.params.id, userId: req.user.id } });
    res.json({ success: true });
});

export default router;
