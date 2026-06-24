import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useRef, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

function ChatWindow() {
    const { currThreadId, setPrevChats, setNewChat, newChat, setCurrThreadId, setAllThreads, setReply, setPrompt } = useContext(MyContext);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const textareaRef = useRef(null);

    const autoResize = () => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
    };

    useEffect(() => { autoResize(); }, [inputValue]);

    const getReply = async () => {
        if (!inputValue.trim() || loading) return;

        const message = inputValue.trim();
        setInputValue("");
        setNewChat(false);
        setLoading(true);

        setPrevChats(prev => [...prev, { role: "user", content: message }]);

        try {
            const response = await fetch(`${API_URL}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, threadId: currThreadId })
            });
            const res = await response.json();
            const reply = res.reply || "Sorry, I could not get a response.";
            setPrevChats(prev => [...prev, { role: "assistant", content: reply }]);
        } catch (err) {
            console.log(err);
            setPrevChats(prev => [...prev, { role: "assistant", content: "Connection error. Please check your backend is running." }]);
        }

        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            getReply();
        }
    };

    return (
        <div className="chatWindow" onClick={() => isOpen && setIsOpen(false)}>
            <div className="navbar">
                <div className="model-name">
                    SigmaGPT <i className="fa-solid fa-chevron-down"></i>
                </div>
                <div className="navbar-right">
                    <button
                        className="user-icon-btn"
                        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                    >
                        U
                    </button>
                </div>
            </div>

            {isOpen && (
                <div className="dropDown" onClick={e => e.stopPropagation()}>
                    <div className="dropDownItem"><i className="fa-solid fa-gear"></i> Settings</div>
                    <div className="dropDownItem"><i className="fa-solid fa-cloud-arrow-up"></i> Upgrade plan</div>
                    <div className="dropDownItem"><i className="fa-solid fa-arrow-right-from-bracket"></i> Log out</div>
                </div>
            )}

            <div className="chat-area">
                {newChat && (
                    <div className="welcome-screen">
                        <div className="welcome-logo">
                            <i className="fa-solid fa-robot"></i>
                        </div>
                        <h1>How can I help you?</h1>
                        <p>Ask me anything — I'm powered by Google Gemini.</p>
                    </div>
                )}

                <Chat />

                {loading && (
                    <div style={{ width: "100%", maxWidth: "700px", padding: "0 16px", margin: "0 auto" }}>
                        <div className="loading-dots">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}
            </div>

            <div className="chat-input-wrapper">
                <div className="input-box">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        placeholder="Message SigmaGPT"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        className="send-btn"
                        onClick={getReply}
                        disabled={!inputValue.trim() || loading}
                        title="Send"
                    >
                        <i className="fa-solid fa-paper-plane"></i>
                    </button>
                </div>
                <p className="info">SigmaGPT can make mistakes. Check important info.</p>
            </div>
        </div>
    );
}

export default ChatWindow;
