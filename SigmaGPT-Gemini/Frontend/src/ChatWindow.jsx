import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useRef, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "";

const MODELS = [
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", badge: "Fast" },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", badge: "Smart" },
    { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite", badge: "Lite" },
];

function ChatWindow() {
    const {
        token, username,
        currThreadId, setCurrThreadId,
        setPrevChats, setNewChat, newChat,
        setAllThreads,
        selectedModel, setSelectedModel,
        handleLogout,
        setSidebarOpen,
    } = useContext(MyContext);

    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [modelOpen, setModelOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const textareaRef = useRef(null);

    const authHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };

    const autoResize = () => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
    };

    useEffect(() => { autoResize(); }, [inputValue]);

    const sendMessage = async () => {
        if (!inputValue.trim() || loading) return;

        const message = inputValue.trim();
        setInputValue("");
        setNewChat(false);
        setLoading(true);

        setPrevChats(prev => [...prev, { role: "user", content: message }]);
        setPrevChats(prev => [...prev, { role: "assistant", content: "", streaming: true }]);

        try {
            const response = await fetch(`${API_URL}/api/chat/stream`, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({ message, threadId: currThreadId, model: selectedModel })
            });

            if (response.status === 401 || response.status === 403) {
                handleLogout();
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let streamText = "";
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
                    if (raw === "[DONE]") break;
                    try {
                        const parsed = JSON.parse(raw);
                        if (parsed.text) {
                            streamText += parsed.text;
                            setPrevChats(prev => {
                                const updated = [...prev];
                                updated[updated.length - 1] = { role: "assistant", content: streamText, streaming: true };
                                return updated;
                            });
                        }
                    } catch {}
                }
            }

            setPrevChats(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: streamText, streaming: false };
                return updated;
            });

            const threadsRes = await fetch(`${API_URL}/api/thread`, { headers: authHeaders });
            if (threadsRes.ok) {
                const data = await threadsRes.json();
                setAllThreads(data.map(t => ({ threadId: t.threadId, title: t.title })));
            }

        } catch (err) {
            console.log(err);
            setPrevChats(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: "Connection error. Is the backend running?", streaming: false };
                return updated;
            });
        }

        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

    return (
        <div className="chatWindow" onClick={() => { setModelOpen(false); setUserMenuOpen(false); }}>
            {/* Navbar */}
            <div className="navbar">
                <div className="navbar-left">
                    {/* Hamburger — mobile only */}
                    <button
                        className="hamburger-btn"
                        onClick={e => { e.stopPropagation(); setSidebarOpen(true); }}
                        title="Open menu"
                    >
                        <i className="fa-solid fa-bars"></i>
                    </button>

                    {/* Model Selector */}
                    <div className="model-selector" onClick={e => e.stopPropagation()}>
                        <button className="model-btn" onClick={() => { setModelOpen(!modelOpen); setUserMenuOpen(false); }}>
                            <span className="model-label">{currentModel.label}</span>
                            <span className="model-badge">{currentModel.badge}</span>
                            <i className="fa-solid fa-chevron-down" style={{ fontSize: "11px", color: "#8e8ea0" }}></i>
                        </button>

                        {modelOpen && (
                            <div className="model-dropdown">
                                <p className="model-dropdown-label">Switch model</p>
                                {MODELS.map(m => (
                                    <button
                                        key={m.id}
                                        className={`model-option ${m.id === selectedModel ? "selected" : ""}`}
                                        onClick={() => { setSelectedModel(m.id); setModelOpen(false); }}
                                    >
                                        <div>
                                            <span className="model-option-name">{m.label}</span>
                                            <span className="model-option-badge">{m.badge}</span>
                                        </div>
                                        {m.id === selectedModel && <i className="fa-solid fa-check"></i>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* User Menu */}
                <div className="user-menu-wrap" onClick={e => e.stopPropagation()}>
                    <button
                        className="user-icon-btn"
                        onClick={() => { setUserMenuOpen(!userMenuOpen); setModelOpen(false); }}
                        title={username}
                    >
                        {username ? username[0].toUpperCase() : "U"}
                    </button>

                    {userMenuOpen && (
                        <div className="user-dropdown">
                            <div className="user-dropdown-info">
                                <div className="ud-avatar">{username ? username[0].toUpperCase() : "U"}</div>
                                <span>{username}</span>
                            </div>
                            <hr className="ud-divider" />
                            <button className="ud-item" onClick={handleLogout}>
                                <i className="fa-solid fa-arrow-right-from-bracket"></i> Log out
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="chat-area">
                {newChat && (
                    <div className="welcome-screen">
                        <div className="welcome-logo">
                            <i className="fa-solid fa-robot"></i>
                        </div>
                        <h1>How can I help you?</h1>
                        <p>Ask me anything — I'm powered by Google Gemini.</p>
                        <div className="welcome-chips">
                            <button onClick={() => { setInputValue("Explain quantum computing simply"); textareaRef.current?.focus(); }}>
                                Explain quantum computing
                            </button>
                            <button onClick={() => { setInputValue("Write a Python function to reverse a string"); textareaRef.current?.focus(); }}>
                                Write Python code
                            </button>
                            <button onClick={() => { setInputValue("Give me tips to improve my productivity"); textareaRef.current?.focus(); }}>
                                Productivity tips
                            </button>
                        </div>
                    </div>
                )}

                <Chat />
            </div>

            {/* Input */}
            <div className="chat-input-wrapper">
                <div className="input-box">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        placeholder="Message SigmaGPT"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                    />
                    <button
                        className="send-btn"
                        onClick={sendMessage}
                        disabled={!inputValue.trim() || loading}
                        title="Send"
                    >
                        {loading
                            ? <i className="fa-solid fa-stop"></i>
                            : <i className="fa-solid fa-paper-plane"></i>
                        }
                    </button>
                </div>
                <p className="info">SigmaGPT can make mistakes. Check important info.</p>
            </div>
        </div>
    );
}

export default ChatWindow;
