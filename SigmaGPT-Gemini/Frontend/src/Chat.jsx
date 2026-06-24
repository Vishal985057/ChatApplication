import "./Chat.css";
import React, { useContext, useState, useEffect, useRef } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function Chat() {
    const { newChat, prevChats, reply } = useContext(MyContext);
    const [latestReply, setLatestReply] = useState(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (reply === null) { setLatestReply(null); return; }
        if (!prevChats?.length) return;

        const words = reply.split(" ");
        let idx = 0;
        const interval = setInterval(() => {
            setLatestReply(words.slice(0, idx + 1).join(" "));
            idx++;
            if (idx >= words.length) clearInterval(interval);
        }, 30);
        return () => clearInterval(interval);
    }, [prevChats, reply]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [prevChats, latestReply]);

    if (newChat || prevChats.length === 0) return null;

    const allButLast = prevChats.slice(0, -1);
    const lastMsg = prevChats[prevChats.length - 1];

    return (
        <div className="chats">
            {allButLast.map((chat, idx) => (
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
                            <div className="assistant-content">
                                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                                    {chat.content}
                                </ReactMarkdown>
                            </div>
                        </>
                    )}
                </div>
            ))}

            {lastMsg && (
                <div className={`message-row ${lastMsg.role === "user" ? "user-row" : "assistant-row"}`}>
                    {lastMsg.role === "user" ? (
                        <p className="userMessage">{lastMsg.content}</p>
                    ) : (
                        <>
                            <div className="assistant-header">
                                <div className="assistant-avatar">
                                    <i className="fa-solid fa-robot"></i>
                                </div>
                                <span className="assistant-label">SigmaGPT</span>
                            </div>
                            <div className="assistant-content">
                                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                                    {latestReply !== null ? latestReply : lastMsg.content}
                                </ReactMarkdown>
                            </div>
                        </>
                    )}
                </div>
            )}
            <div className="scroll-anchor" ref={scrollRef}></div>
        </div>
    );
}

export default Chat;
