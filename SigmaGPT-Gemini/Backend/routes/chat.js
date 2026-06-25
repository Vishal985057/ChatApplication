import express from "express";
import Thread from "../models/Thread.js";
import { getGeminiResponse, streamGeminiResponse } from "../utils/gemini.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticateToken);

// GET /api/thread — all threads for logged-in user
router.get("/thread", async (req, res) => {
    try {
        const threads = await Thread.find({ userId: req.user.userId }).sort({ updatedAt: -1 });
        res.json(threads);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to fetch threads" });
    }
});

// GET /api/thread/:threadId — messages for a thread
router.get("/thread/:threadId", async (req, res) => {
    try {
        const thread = await Thread.findOne({ threadId: req.params.threadId, userId: req.user.userId });
        if (!thread) return res.status(404).json({ error: "Thread not found" });
        res.json(thread.messages);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

// DELETE /api/thread/:threadId
router.delete("/thread/:threadId", async (req, res) => {
    try {
        const deleted = await Thread.findOneAndDelete({ threadId: req.params.threadId, userId: req.user.userId });
        if (!deleted) return res.status(404).json({ error: "Thread not found" });
        res.json({ success: "Thread deleted" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to delete thread" });
    }
});

// POST /api/chat/stream — streaming SSE response
router.post("/chat/stream", async (req, res) => {
    const { threadId, message, model } = req.body;
    if (!threadId || !message)
        return res.status(400).json({ error: "Missing required fields" });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
        let thread = await Thread.findOne({ threadId, userId: req.user.userId });
        if (!thread) {
            thread = new Thread({
                threadId,
                userId: req.user.userId,
                title: message.slice(0, 60),
                messages: []
            });
        }

        thread.messages.push({ role: "user", content: message });

        const fullReply = await streamGeminiResponse(thread.messages, model || "gemini-2.5-flash", res);

        thread.messages.push({ role: "assistant", content: fullReply });
        thread.updatedAt = new Date();
        await thread.save();
    } catch (err) {
        console.log(err);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.write("data: [DONE]\n\n");
    }

    res.end();
});

// POST /api/chat — non-streaming fallback
router.post("/chat", async (req, res) => {
    const { threadId, message, model } = req.body;
    if (!threadId || !message)
        return res.status(400).json({ error: "Missing required fields" });

    try {
        let thread = await Thread.findOne({ threadId, userId: req.user.userId });
        if (!thread) {
            thread = new Thread({
                threadId,
                userId: req.user.userId,
                title: message.slice(0, 60),
                messages: []
            });
        }

        thread.messages.push({ role: "user", content: message });
        const reply = await getGeminiResponse(thread.messages, model || "gemini-2.5-flash");
        thread.messages.push({ role: "assistant", content: reply });
        thread.updatedAt = new Date();
        await thread.save();

        res.json({ reply });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message || "Something went wrong" });
    }
});

export default router;
