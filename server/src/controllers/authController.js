// src/controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
// import bcrypt from "bcryptjs";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Register User
export const registerUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) return res.status(400).json({ error: "Email and password required." });

        const existing = await User.findOne({ where: { email } });
        if (existing) return res.status(400).json({ error: "Email already registered." });

        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = await User.create({ email, passwordHash });

        const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: "1h" });
        res.json({ success: true, token });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Sign In User
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) return res.status(400).json({ error: "Email and password required." });

        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(401).json({ error: "Invalid credentials." });

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return res.status(401).json({ error: "Invalid credentials." });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });
        res.json({ success: true, token });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 🚪 Sign OUT (Stateless)
export const logoutUser = async (req, res) => {
    try {
        // Instruct client to delete token
        return res.status(200).json({
            success: true,
            message: "User logged out successfully. Please remove your token from client storage."
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 🚫 CHECK UNAUTHORIZED
export const checkUnauthorized = async (req, res) => {
    return res.status(401).json({
        success: false,
        message: "Unauthorized access. Please log in again."
    });
};