import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "sigmagpt-secret-2024";

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password)
        return res.status(400).json({ error: "Username and password are required." });
    if (username.trim().length < 3)
        return res.status(400).json({ error: "Username must be at least 3 characters." });
    if (password.length < 6)
        return res.status(400).json({ error: "Password must be at least 6 characters." });

    // Block special characters in username
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim()))
        return res.status(400).json({ error: "Username can only contain letters, numbers, and underscores." });

    try {
        const existing = await User.findOne({ username: username.trim().toLowerCase() });
        if (existing) return res.status(409).json({ error: "Username already taken. Try a different one." });

        const user = new User({ username: username.trim(), password });
        await user.save();

        const token = jwt.sign(
            { userId: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: "7d" }
        );
        res.status(201).json({ token, username: user.username });
    } catch (err) {
        console.error("Signup error:", err);
        if (err.code === 11000) {
            return res.status(409).json({ error: "Username already taken. Try a different one." });
        }
        res.status(500).json({ error: "Signup failed. Please try again." });
    }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password)
        return res.status(400).json({ error: "Username and password are required." });

    try {
        const user = await User.findOne({ username: username.trim().toLowerCase() });
        if (!user)
            return res.status(401).json({ error: "Invalid username or password." });

        const valid = await user.comparePassword(password);
        if (!valid)
            return res.status(401).json({ error: "Invalid username or password." });

        const token = jwt.sign(
            { userId: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: "7d" }
        );
        res.json({ token, username: user.username });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Login failed. Please try again." });
    }
});

export default router;
