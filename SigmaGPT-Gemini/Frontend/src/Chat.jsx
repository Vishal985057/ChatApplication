import "./Chat.css";
import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function CopyButton({ getText }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e) => {
        e.stopPropagation();
        try {
            const text = getText();
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    return (
        <button
            className={`copy-btn ${copied ? "copy-btn--copied" : ""}`}
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy code"}
            aria-label={copied ? "Copied!" : "Copy code"}
        >
            {copied
                ? <><i className="fa-solid fa-check"></i><span>Copied!</span></>
                : <><i className="fa-regular fa-copy"></i><span>Copy</span></>
            }
        </button>
    );
}

function CodeBlock({ children, ...props }) {
    const preRef = useRef(null);

    const getText = useCallback(() => {
        return preRef.current?.querySelector("code")?.innerText ?? "";
    }, []);

    return (
        <div className="code-block-wrapper">
            <CopyButton getText={getText} />
            <pre ref={preRef} {...props}>
                {children}
            </pre>
        </div>
    );
}

const MD_COMPONENTS = {
    pre: CodeBlock,
};

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
                                <ReactMarkdown
                                    rehypePlugins={[rehypeHighlight]}
                                    components={MD_COMPONENTS}
                                >
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
