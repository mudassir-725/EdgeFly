// src/routes/authRoutes.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";  // direct import, not from index.js
import authMiddleware from "../middleware/authMiddleware.js";  // make sure this exists
import { logoutUser, checkUnauthorized } from "../controllers/authController.js";

dotenv.config();

const router = express.Router();

// 🧾 Register new user
router.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;

        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const newUser = await User.create({ email, passwordHash: password });
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: { id: newUser.id, email: newUser.email },
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ success: false, message: "Registration failed" });
    }
});

// 🔑 Login user
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const validPassword = await user.validatePassword(password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: { id: user.id, email: user.email },
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ success: false, message: "Login failed" });
    }
});

// 🧭 Get logged-in user details (protected)
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ["id", "email", "preferences", "createdAt"],
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("Auth /me error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch user" });
    }
});

// 🚪 Logout (protected so you can clear client session)
router.post("/logout", authMiddleware, logoutUser);

// 🚫 Unauthorized check (for frontend handling)
router.get("/unauthorized", checkUnauthorized);


export default router;
