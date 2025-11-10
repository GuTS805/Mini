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
    <div className="login-screen">

      <div className="login-card">
        <div className="neon-orb">⚡</div>

        <h2>Welcome Back</h2>
        <p className="subtext">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>

        {error && <p className="error">{error}</p>}

        <div className="field">
          <input type="email" required onChange={(e) => setEmail(e.target.value)} />
          <label>Email Address</label>
        </div>

        <div className="field">
          <input type="password" required onChange={(e) => setPassword(e.target.value)} />
          <label>Password</label>
        </div>

        <button className="login-btn" onClick={loginUser}>
          Login
        </button>

        <div className="divider">OR</div>

        <div className="oauth-row">
          <button></button>
          <button>G</button>
          <button>✖</button>
        </div>
      </div>

      <style>{`
        .login-screen {
          height: 100vh;
          width: 100%;
          background:
            linear-gradient(180deg, rgba(3, 7, 18, 0.82), rgba(3, 7, 18, 0.82)),
            url("/assets/login-tech-bg.jpg") center/cover no-repeat;
          background-attachment: fixed;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          backdrop-filter: blur(2px);
          animation: fadeIn 0.8s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .login-card {
          width: 370px;
          background: rgba(10, 10, 18, 0.75);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(155, 80, 255, 0.35);
          border-radius: 14px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 0 25px rgba(155, 80, 255, 0.45);
          animation: pop 0.4s ease-out;
        }

        @keyframes pop {
          from { transform: scale(.94); opacity: .4; }
          to { transform: scale(1); opacity: 1; }
        }

        .neon-orb {
          width: 70px;
          height: 70px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 50%;
          margin: 0 auto 12px;
          font-size: 26px;
          color: white;
          background: radial-gradient(circle, #9f6bff, #5a22f1);
          box-shadow: 0 0 45px #7f5eff;
        }

        h2 { color: white; font-size: 24px; margin-bottom: 4px; }
        .subtext { color: #b8b8d9; font-size: 14px; margin-bottom: 18px; }
        .subtext a { color: #9f6bff; text-decoration: none; }

        .error { color: #ff4d6d; margin-bottom: 10px; font-size: 14px; }

        .field { position: relative; margin-bottom: 18px; }
        .field input {
          width: 100%;
          padding: 14px;
          background: #0b0b14;
          border: 1px solid #322c5c;
          color: white;
          border-radius: 6px;
          outline: none;
          transition: border 0.2s;
        }
        .field input:focus {
          border-color: #9f6bff;
        }
        .field label {
          position: absolute;
          left: 14px;
          top: 13px;
          font-size: 13px;
          color: #8a88c2;
          transition: .22s;
          pointer-events: none;
        }
        .field input:focus + label, .field input:valid + label {
          top: -7px;
          font-size: 11px;
          color: #c19aff;
        }

        .login-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(90deg, #8e5bff, #6c37ff);
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.22s;
          box-shadow: 0 0 18px rgba(140, 80, 255, .4);
        }
        .login-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.12);
        }

        .divider {
          margin: 16px 0;
          font-size: 12px;
          color: #999;
        }

        .oauth-row {
          display: flex;
          justify-content: center;
          gap: 12px;
        }
        .oauth-row button {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          border: 1px solid #3f3963;
          background: rgba(20,20,35,.8);
          color: white;
          cursor: pointer;
          transition: 0.2s;
        }
        .oauth-row button:hover {
          border-color: #9f6bff;
          box-shadow: 0 0 12px #9f6bff;
        }
      `}</style>
    </div>
  );
}
