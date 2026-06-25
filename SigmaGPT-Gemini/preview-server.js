import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// In-memory storage
const threads = new Map();

// --- Gemini API call ---
async function getGeminiReply(message) {
    if (!process.env.GEMINI_API_KEY) {
        return `[Preview Mode] You said: "${message}". Add GEMINI_API_KEY to Replit Secrets for real AI responses.`;
    }
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: message }] }]
                })
            }
        );
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (err) {
        console.error("Gemini error:", err);
        return "Sorry, I could not get a response from Gemini.";
    }
}

// --- API Routes ---

// Get all threads
app.get("/api/thread", (req, res) => {
    const result = Array.from(threads.values())
        .map(t => ({ threadId: t.threadId, title: t.title, updatedAt: t.updatedAt }))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(result);
});

// Get messages for a thread
app.get("/api/thread/:threadId", (req, res) => {
    const thread = threads.get(req.params.threadId);
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    res.json(thread.messages);
});

// Delete a thread
app.delete("/api/thread/:threadId", (req, res) => {
    if (!threads.has(req.params.threadId))
        return res.status(404).json({ error: "Thread not found" });
    threads.delete(req.params.threadId);
    res.json({ success: "Thread deleted" });
});

// Chat
app.post("/api/chat", async (req, res) => {
    const { threadId, message } = req.body;
    if (!threadId || !message)
        return res.status(400).json({ error: "Missing required fields" });

    let thread = threads.get(threadId);
    if (!thread) {
        thread = { threadId, title: message.slice(0, 40), messages: [], updatedAt: new Date() };
        threads.set(threadId, thread);
    }

    thread.messages.push({ role: "user", content: message });
    thread.updatedAt = new Date();

    const reply = await getGeminiReply(message);

    thread.messages.push({ role: "assistant", content: reply });
    res.json({ reply });
});

// Serve built frontend
const distPath = path.join(__dirname, "Frontend", "dist");
app.use(express.static(distPath));
app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
    console.log(`SigmaGPT preview running on port ${PORT}`);
});
