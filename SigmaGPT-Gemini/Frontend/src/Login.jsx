import { useState } from "react";
import "./Login.css";
import logo from "./assets/blacklogo.png";

const API_URL = import.meta.env.VITE_API_URL ?? "";

function Login({ onLogin }) {
    const [mode, setMode] = useState("login"); // "login" | "signup"
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!username.trim() || !password.trim()) {
            setError("Please fill in all fields.");
            return;
        }

        setLoading(true);
        try {
            const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username.trim(), password })
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Something went wrong.");
            } else {
                localStorage.setItem("sigmagpt_token", data.token);
                localStorage.setItem("sigmagpt_username", data.username);
                onLogin(data.token, data.username);
            }
        } catch (err) {
            setError("Cannot connect to server. Please check your backend.");
        }
        setLoading(false);
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <img src={logo} alt="SigmaGPT" />
                    <h1>SigmaGPT</h1>
                    <p>Powered by Google Gemini</p>
                </div>

                <div className="login-tabs">
                    <button
                        className={mode === "login" ? "tab active" : "tab"}
                        onClick={() => { setMode("login"); setError(""); }}
                    >
                        Log In
                    </button>
                    <button
                        className={mode === "signup" ? "tab active" : "tab"}
                        onClick={() => { setMode("signup"); setError(""); }}
                    >
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            autoFocus
                            autoComplete="username"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder={mode === "signup" ? "Min. 6 characters" : "Enter your password"}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                        />
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
                    </button>
                </form>

                <p className="login-switch">
                    {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                    <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
                        {mode === "login" ? "Sign up" : "Log in"}
                    </span>
                </p>
            </div>
        </div>
    );
}

export default Login;
