import "./Sidebar.css";
import { useContext, useEffect } from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";
import logo from "./assets/blacklogo.png";

const API_URL = import.meta.env.VITE_API_URL ?? "";

function Sidebar() {
    const {
        token, username,
        allThreads, setAllThreads,
        currThreadId, setCurrThreadId,
        setNewChat, setPrevChats,
        handleLogout,
        sidebarOpen, setSidebarOpen,
    } = useContext(MyContext);

    const authHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };

    const getAllThreads = async () => {
        try {
            const res = await fetch(`${API_URL}/api/thread`, { headers: authHeaders });
            if (res.status === 401 || res.status === 403) { handleLogout(); return; }
            const data = await res.json();
            setAllThreads(data.map(t => ({ threadId: t.threadId, title: t.title })));
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        getAllThreads();
    }, [currThreadId]);

    const createNewChat = () => {
        setNewChat(true);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
        setSidebarOpen(false);
    };

    const changeThread = async (threadId) => {
        setCurrThreadId(threadId);
        setSidebarOpen(false);
        try {
            const res = await fetch(`${API_URL}/api/thread/${threadId}`, { headers: authHeaders });
            if (res.status === 401 || res.status === 403) { handleLogout(); return; }
            const data = await res.json();
            setPrevChats(data);
            setNewChat(false);
        } catch (err) {
            console.log(err);
        }
    };

    const deleteThread = async (e, threadId) => {
        e.stopPropagation();
        try {
            await fetch(`${API_URL}/api/thread/${threadId}`, { method: "DELETE", headers: authHeaders });
            setAllThreads(prev => prev.filter(t => t.threadId !== threadId));
            if (threadId === currThreadId) createNewChat();
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <section className={`sidebar ${sidebarOpen ? "sidebar-mobile-open" : ""}`}>
            <div className="sidebar-top">
                <button className="logo-btn" onClick={createNewChat}>
                    <img src={logo} alt="logo" className="logo" />
                    <span>SigmaGPT</span>
                </button>
                <div className="sidebar-top-right">
                    <button className="new-chat-btn" onClick={createNewChat} title="New chat">
                        <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} title="Close">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>

            {allThreads.length > 0 && <p className="history-label">Recent</p>}

            <ul className="history">
                {allThreads.map((thread, idx) => (
                    <li
                        key={idx}
                        onClick={() => changeThread(thread.threadId)}
                        className={thread.threadId === currThreadId ? "highlighted" : ""}
                    >
                        <span className="thread-title">{thread.title}</span>
                        <button
                            className="delete-btn"
                            onClick={(e) => deleteThread(e, thread.threadId)}
                            title="Delete"
                        >
                            <i className="fa-solid fa-trash"></i>
                        </button>
                    </li>
                ))}
            </ul>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">{username ? username[0].toUpperCase() : "U"}</div>
                    <span className="user-name">{username || "User"}</span>
                </div>
                <button className="logout-btn" onClick={handleLogout} title="Log out">
                    <i className="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
            </div>
        </section>
    );
}

export default Sidebar;
