import "dotenv/config";

const AVAILABLE_MODELS = {
    "gemini-2.5-flash": "gemini-2.5-flash",
    "gemini-2.5-pro": "gemini-2.5-pro",
    "gemini-2.0-flash-lite": "gemini-2.0-flash-lite",
};

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function buildContents(messages) {
    // Filter out empty messages and build Gemini-compatible format
    return messages
        .filter(m => m.content && m.content.trim())
        .map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
        }));
}

function getApiKey() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set in environment variables.");
    return key;
}

// Regular response (non-streaming)
export const getGeminiResponse = async (messages, model = "gemini-2.5-flash") => {
    const modelName = AVAILABLE_MODELS[model] || "gemini-2.5-flash";
    const apiKey = getApiKey();
    const contents = buildContents(messages);

    if (contents.length === 0) throw new Error("No valid messages to send.");

    const response = await fetch(
        `${GEMINI_BASE}/${modelName}:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents })
        }
    );

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error?.message || `Gemini API error (${response.status})`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No response from Gemini. Try again.");
    return text;
};

// Streaming response — writes SSE chunks to res, returns full text
export const streamGeminiResponse = async (messages, model = "gemini-2.5-flash", res) => {
    const modelName = AVAILABLE_MODELS[model] || "gemini-2.5-flash";
    const apiKey = getApiKey();
    const contents = buildContents(messages);

    if (contents.length === 0) throw new Error("No valid messages to send.");

    const response = await fetch(
        `${GEMINI_BASE}/${modelName}:streamGenerateContent?key=${apiKey}&alt=sse`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents })
        }
    );

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Gemini API error (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === "[DONE]") continue;
            try {
                const parsed = JSON.parse(raw);
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
                if (text) {
                    fullText += text;
                    res.write(`data: ${JSON.stringify({ text })}\n\n`);
                }
            } catch {
                // Skip malformed chunks
            }
        }
    }

    res.write("data: [DONE]\n\n");
    return fullText;
};

export default getGeminiResponse;
