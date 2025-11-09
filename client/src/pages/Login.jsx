import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API_URL = "http://localhost:5000";

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
    <div className="login-page">

      {/* Center Card */}
      <div className="login-card">
        <div className="logo-circle">⚡</div>

        <h2>Welcome Back</h2>
        <p className="sub">Don't have an account? <Link to="/signup">Sign up</Link></p>

        {error && <p className="error">{error}</p>}

        <div className="input-field">
          <input type="email" onChange={(e) => setEmail(e.target.value)} required />
          <label>Email Address</label>
        </div>

        <div className="input-field">
          <input type="password" onChange={(e) => setPassword(e.target.value)} required />
          <label>Password</label>
        </div>

        <button className="login-btn" onClick={loginUser}>
          Login
        </button>

        <div className="split"><span>OR</span></div>

        <div className="oauth-btns">
          <button className="o-btn"></button>
          <button className="o-btn">G</button>
          <button className="o-btn">✖</button>
        </div>
      </div>

      {/* Background Wires */}
      <div className="wire w1" />
      <div className="wire w2" />
      <div className="wire w3" />
      <div className="wire w4" />

      <style>{`
        .login-page {
          height: 100vh;
          background: #000;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          font-family: Inter, sans-serif;
        }

        .login-card {
          background: #0b0b0f;
          padding: 40px 50px;
          border-radius: 12px;
          width: 350px;
          text-align: center;
          border: 1px solid #1a1a22;
          box-shadow: 0 0 40px rgba(127,94,255,0.2);
          position: relative;
          z-index: 5;
        }

        .logo-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7f5eff, #4b32d3);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          font-size: 24px;
          color: white;
        }

        h2 { color: white; margin-bottom: 6px; }
        .sub { color: #787a91; font-size: 14px; margin-bottom: 16px; }
        .sub a { color: #7f5eff; text-decoration: none; }

        .error { color: #ff5f5f; margin-bottom: 10px; font-size: 14px; }

        .input-field { position: relative; margin-bottom: 18px; }
        .input-field input {
          width: 100%;
          padding: 12px;
          background: #0f0f16;
          border: 1px solid #232333;
          color: white;
          outline: none;
          border-radius: 6px;
        }
        .input-field label {
          position: absolute;
          left: 12px;
          top: 13px;
          font-size: 13px;
          color: #717296;
          transition: 0.2s;
        }
        .input-field input:focus + label,
        .input-field input:valid + label {
          top: -7px;
          font-size: 11px;
          color: #7f5eff;
        }

        .login-btn {
          width: 100%;
          padding: 12px;
          background: #7f5eff;
          border: none;
          border-radius: 6px;
          color: white;
          cursor: pointer;
          margin-top: 6px;
          font-weight: 600;
          transition: .2s;
        }
        .login-btn:hover {
          filter: brightness(1.12);
          transform: translateY(-2px);
        }

        .split {
          margin: 14px 0;
          color: #555;
          font-size: 13px;
        }
        .split span { background: #0b0b0f; padding: 0 8px; }

        .oauth-btns {
          display: flex;
          justify-content: center;
          gap: 10px;
        }
        .o-btn {
          width: 38px;
          height: 38px;
          border-radius: 6px;
          border: 1px solid #2f2f42;
          background: #111118;
          color: white;
          cursor: pointer;
        }

        .wire {
          width: 200px;
          height: 1.5px;
          background: #181821;
          position: absolute;
        }
        .w1 { top: 35%; left: 12%; }
        .w2 { top: 35%; right: 12%; }
        .w3 { bottom: 35%; left: 12%; }
        .w4 { bottom: 35%; right: 12%; }
      `}</style>
    </div>
  );
}
