import "./Sidebar.css";
import { useContext, useEffect } from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";
import logo from "./assets/blacklogo.png";

const API_URL = import.meta.env.VITE_API_URL ?? "";

function Sidebar() {
    const { allThreads, setAllThreads, currThreadId, setNewChat, setPrompt, setReply, setCurrThreadId, setPrevChats } = useContext(MyContext);

    const getAllThreads = async () => {
        try {
            const response = await fetch(`${API_URL}/api/thread`);
            const res = await response.json();
            const filteredData = res.map(thread => ({ threadId: thread.threadId, title: thread.title }));
            setAllThreads(filteredData);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        getAllThreads();
    }, [currThreadId]);

    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
    };

    const changeThread = async (newThreadId) => {
        setCurrThreadId(newThreadId);
        try {
            const response = await fetch(`${API_URL}/api/thread/${newThreadId}`);
            const res = await response.json();
            setPrevChats(res);
            setNewChat(false);
            setReply(null);
        } catch (err) {
            console.log(err);
        }
    };

    const deleteThread = async (threadId) => {
        try {
            await fetch(`${API_URL}/api/thread/${threadId}`, { method: "DELETE" });
            setAllThreads(prev => prev.filter(t => t.threadId !== threadId));
            if (threadId === currThreadId) createNewChat();
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <section className="sidebar">
            <div className="sidebar-top">
                <button className="logo-btn" onClick={createNewChat}>
                    <img src={logo} alt="logo" className="logo" />
                    <span>SigmaGPT</span>
                </button>
                <button className="new-chat-btn" onClick={createNewChat} title="New chat">
                    <i className="fa-solid fa-pen-to-square"></i>
                </button>
            </div>

            {allThreads.length > 0 && (
                <p className="history-label">Recent</p>
            )}

            <ul className="history">
                {allThreads?.map((thread, idx) => (
                    <li
                        key={idx}
                        onClick={() => changeThread(thread.threadId)}
                        className={thread.threadId === currThreadId ? "highlighted" : ""}
                    >
                        <span className="thread-title">{thread.title}</span>
                        <button
                            className="delete-btn"
                            onClick={(e) => { e.stopPropagation(); deleteThread(thread.threadId); }}
                            title="Delete"
                        >
                            <i className="fa-solid fa-trash"></i>
                        </button>
                    </li>
                ))}
            </ul>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">U</div>
                    <span className="user-name">User</span>
                </div>
            </div>
        </section>
    );
}

export default Sidebar;
