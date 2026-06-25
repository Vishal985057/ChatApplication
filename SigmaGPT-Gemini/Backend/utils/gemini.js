import "dotenv/config";

const AVAILABLE_MODELS = {
    "gemini-2.5-flash": "gemini-2.5-flash",
    "gemini-2.5-pro": "gemini-2.5-pro",
    "gemini-2.0-flash-lite": "gemini-2.0-flash-lite",
};

function buildContents(messages) {
    return messages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
    }));
}

// Regular response (non-streaming)
export const getGeminiResponse = async (messages, model = "gemini-2.5-flash") => {
    const modelName = AVAILABLE_MODELS[model] || "gemini-2.5-flash";

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: buildContents(messages) })
        }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Gemini API error");
    return data.candidates[0].content.parts[0].text;
};

// Streaming response — writes SSE chunks to `res`, returns full text
export const streamGeminiResponse = async (messages, model = "gemini-2.5-flash", res) => {
    const modelName = AVAILABLE_MODELS[model] || "gemini-2.5-flash";

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?key=${process.env.GEMINI_API_KEY}&alt=sse`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: buildContents(messages) })
        }
    );

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Gemini API error");
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
            } catch {}
        }
    }

    res.write("data: [DONE]\n\n");
    return fullText;
};

export default getGeminiResponse;
