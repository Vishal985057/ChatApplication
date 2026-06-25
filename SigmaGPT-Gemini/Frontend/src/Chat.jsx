import "./Chat.css";
import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

/* ── Copy button ── */
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

/* ── Code block with copy button ── */
function CodeBlock({ children, ...props }) {
    const preRef = useRef(null);
    const getText = useCallback(() => {
        return preRef.current?.querySelector("code")?.innerText ?? "";
    }, []);

    return (
        <div className="code-block-wrapper">
            <CopyButton getText={getText} />
            <pre ref={preRef} {...props}>{children}</pre>
        </div>
    );
}

const MD_COMPONENTS = { pre: CodeBlock };

/* ── Typewriter hook ──
   Animates text character by character.
   - When behind by many chars: "catchup" mode (renders several chars per tick)
   - When close: slow smooth typing (1 char per tick)
   - When streaming ends: instantly shows full text
*/
function useTypewriter(content, streaming) {
    const [displayed, setDisplayed] = useState(() => streaming ? "" : content);
    const posRef    = useRef(streaming ? 0 : content.length);
    const timerRef  = useRef(null);
    const contentRef = useRef(content);

    useEffect(() => {
        contentRef.current = content;

        if (!streaming) {
            // Streaming done — snap to full text immediately
            if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
            setDisplayed(content);
            posRef.current = content.length;
            return;
        }

        // Start animation loop only if not already running
        if (!timerRef.current) {
            const tick = () => {
                const full = contentRef.current;
                const remaining = full.length - posRef.current;

                if (remaining <= 0) {
                    timerRef.current = null;   // caught up — stop until next chunk
                    return;
                }

                // Catchup: render more chars when we're far behind
                const chunkSize = remaining > 120 ? 10
                                : remaining > 50  ? 4
                                : remaining > 15  ? 2
                                :                   1;

                posRef.current = Math.min(posRef.current + chunkSize, full.length);
                setDisplayed(full.slice(0, posRef.current));
                timerRef.current = setTimeout(tick, 18);   // ~55 ticks/s
            };

            timerRef.current = setTimeout(tick, 18);
        }
    }, [content, streaming]);

    // Cleanup on unmount
    useEffect(() => {
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    return displayed;
}

/* ── Single assistant message with typewriter ── */
function AssistantMessage({ content, streaming }) {
    const text = useTypewriter(content, streaming);

    return (
        <div className={`assistant-content ${streaming ? "streaming" : ""}`}>
            <ReactMarkdown
                rehypePlugins={[rehypeHighlight]}
                components={MD_COMPONENTS}
            >
                {text || ""}
            </ReactMarkdown>
            {streaming && <span className="cursor-blink">▍</span>}
        </div>
    );
}

/* ── Main Chat component ── */
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
                <div
                    key={idx}
                    className={`message-row ${chat.role === "user" ? "user-row" : "assistant-row"}`}
                >
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
                            <AssistantMessage
                                content={chat.content}
                                streaming={chat.streaming ?? false}
                            />
                        </>
                    )}
                </div>
            ))}
            <div className="scroll-anchor" ref={scrollRef}></div>
        </div>
    );
}

export default Chat;
