import "./Chat.css";
import React, { useContext, useEffect, useRef } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function Chat() {
    const { newChat, prevChats } = useContext(MyContext);
    const scrollRef = useRef(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [prevChats]);

    if (newChat || prevChats.length === 0) return null;

    return (
        <div className="chats">
            {prevChats.map((chat, idx) => (
                <div key={idx} className={`message-row ${chat.role === "user" ? "user-row" : "assistant-row"}`}>
                    {chat.role === "user" ? (
                        <p className="userMessage">{chat.content}</p>
                    ) : (
                        <>
                            <div className="assistant-header">
                                <div className="assistant-avatar">
                                    <i className="fa-solid fa-robot"></i>
                                </div>
                                <span className="assistant-label">SigmaGPT</span>
                            </div>
                            <div className={`assistant-content ${chat.streaming ? "streaming" : ""}`}>
                                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                                    {chat.content || ""}
                                </ReactMarkdown>
                                {chat.streaming && <span className="cursor-blink">▍</span>}
                            </div>
                        </>
                    )}
                </div>
            ))}
            <div className="scroll-anchor" ref={scrollRef}></div>
        </div>
    );
}

export default Chat;
