import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT || 8080;

// ── Validate required environment variables on startup ──
const REQUIRED_ENV = ["MONGODB_URI", "GEMINI_API_KEY", "JWT_SECRET"];
const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
    console.error("Missing required environment variables:", missingEnv.join(", "));
    console.error("Please check your .env file or Render environment settings.");
    process.exit(1);
}

// ── CORS: allow all origins (works for both local and Render) ──
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ── IMPORTANT: auth routes MUST come before chat routes ──
// chatRoutes applies authenticateToken middleware to everything under /api,
// so /api/auth/* would get blocked if chatRoutes were registered first.
app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);

// ── Health check ──
app.get("/health", (req, res) => {
    res.json({ status: "ok", db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

// ── 404 handler ──
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ──
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

// ── Start server then connect DB ──
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await connectDB();
});

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB!");
    } catch (err) {
        console.error("Failed to connect to MongoDB:", err.message);
        console.error("Check your MONGODB_URI and make sure 0.0.0.0/0 is whitelisted in Atlas.");
        process.exit(1);
    }
};
