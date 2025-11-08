import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const loginUser = async () => {
        try {
            const res = await axios.post(`${API_URL}/auth/login`, { email, password });
            localStorage.setItem("token", res.data.token);
            navigate("/play");
        } catch (err) {
            setError(err.response?.data?.error || "Login failed");
        }
    };

    return (
        <div className="login-wrapper">

            <div className="login-box">
                <div className="logo-circle">⚡</div>

                <h2>Welcome Back</h2>
                <p className="sub">Don't have an account? <Link to="/signup">Sign up</Link></p>

                {error && <div className="error">{error}</div>}

                <div className="input-group">
                    <input required type="email" onChange={(e) => setEmail(e.target.value)} />
                    <label>Email Address</label>
                </div>

                <div className="input-group">
                    <input required type="password" onChange={(e) => setPassword(e.target.value)} />
                    <label>Password</label>
                </div>

                <button className="login-btn" onClick={loginUser}>Login</button>

                <div className="or">OR</div>

                <div className="soc-buttons">
                    <button></button>
                    <button>G</button>
                    <button>✖</button>
                </div>
            </div>

            {/* Background Wires */}
            <div className="wire w1"></div>
            <div className="wire w2"></div>
            <div className="wire w3"></div>
            <div className="wire w4"></div>

            <style>{`
        .login-wrapper {
          background: #000;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          font-family: 'Inter', sans-serif;
        }

        .login-box {
          width: 360px;
          background: #0b0b0f;
          padding: 38px 45px;
          border-radius: 12px;
          border: 1px solid #1a1a22;
          box-shadow: 0 0 40px rgba(127,94,255,0.2);
          text-align: center;
          position: relative;
          z-index: 5;
        }

        .logo-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7f5eff, #5032ff);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: auto;
          font-size: 28px;
          color: white;
        }

        h2 {
          color: white;
          margin-top: 16px;
          font-weight: 700;
        }

        .sub {
          margin-top: 4px;
          margin-bottom: 18px;
          font-size: 14px;
          color: #8d8fa5;
        }

        .sub a { color: #7f5eff; text-decoration: none; }

        .error {
          background: #ff3c3c22;
          border: 1px solid #ff5f5f;
          color: #ffb5b5;
          padding: 8px;
          border-radius: 6px;
          margin-bottom: 12px;
          font-size: 13px;
        }

        .input-group {
          position: relative;
          margin-bottom: 18px;
        }

        .input-group input {
          width: 100%;
          padding: 12px;
          border-radius: 6px;
          background: #0f0f16;
          border: 1px solid #272737;
          color: white;
          outline: none;
        }

        .input-group label {
          position: absolute;
          left: 14px;
          top: 12px;
          color: #777796;
          transition: 0.2s;
          pointer-events: none;
        }

        .input-group input:focus + label,
        .input-group input:not(:placeholder-shown) + label {
          top: -8px;
          font-size: 11px;
          color: #7f5eff;
        }

        .login-btn {
          width: 100%;
          padding: 12px;
          color: white;
          background: #0a56f0;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: 0.2s;
        }

        .login-btn:hover {
          filter: brightness(1.15);
          transform: translateY(-2px);
        }

        .or {
          color: #666;
          margin: 12px 0;
          font-size: 13px;
        }

        .soc-buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .soc-buttons button {
          width: 38px;
          height: 38px;
          border-radius: 6px;
          background: #111118;
          border: 1px solid #2a2a3b;
          color: white;
          cursor: pointer;
          font-size: 16px;
        }

        .wire {
          width: 260px;
          height: 1.5px;
          background: #16161f;
          position: absolute;
        }

        .w1 { top: 36%; left: 10%; }
        .w2 { top: 36%; right: 10%; }
        .w3 { bottom: 36%; left: 10%; }
        .w4 { bottom: 36%; right: 10%; }
      `}</style>
        </div>
    );
}
