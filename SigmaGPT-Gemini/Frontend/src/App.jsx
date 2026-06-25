import './App.css';
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import Login from "./Login.jsx";
import { MyContext } from "./MyContext.jsx";
import { useState } from 'react';
import { v1 as uuidv1 } from "uuid";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("sigmagpt_token") || "");
  const [username, setUsername] = useState(() => localStorage.getItem("sigmagpt_username") || "");
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogin = (newToken, newUsername) => {
    setToken(newToken);
    setUsername(newUsername);
  };

  const handleLogout = () => {
    localStorage.removeItem("sigmagpt_token");
    localStorage.removeItem("sigmagpt_username");
    setToken("");
    setUsername("");
    setPrevChats([]);
    setAllThreads([]);
    setNewChat(true);
    setCurrThreadId(uuidv1());
    setSidebarOpen(false);
  };

  const providerValues = {
    token, username,
    currThreadId, setCurrThreadId,
    newChat, setNewChat,
    prevChats, setPrevChats,
    allThreads, setAllThreads,
    selectedModel, setSelectedModel,
    handleLogout,
    sidebarOpen, setSidebarOpen,
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className='app'>
      <MyContext.Provider value={providerValues}>
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}
        <Sidebar />
        <ChatWindow />
      </MyContext.Provider>
    </div>
  );
}

export default App;
