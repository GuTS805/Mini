import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function Signup() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const signupUser = async () => {
        try {
            const res = await axios.post(`${API_URL}/auth/signup`, {
                username,
                email,
                password,
            });

            localStorage.setItem("token", res.data.token);
            navigate("/home");
        } catch (err) {
            setError(err.response?.data?.error || "Signup failed");
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-box">
                <div className="logo-circle"></div>

                <h2>Create Account</h2>
                <p className="sub">
                    Already registered? <Link to="/login">Login</Link>
                </p>

                {error && <p className="err">{error}</p>}

                <input
                    placeholder="Username"
                    onChange={(e) => setUsername(e.target.value)}
                />

                <input
                    type="email"
                    placeholder="Email Address"
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button onClick={signupUser}>Create Account</button>
            </div>

            <style>{`
        .auth-wrapper {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #070707;
          background-image:
            radial-gradient(circle at 20% 20%, #111 0%, transparent 40%),
            radial-gradient(circle at 80% 80%, #0d0d0d 0%, transparent 40%);
          font-family: 'Inter', sans-serif;
        }

        .auth-box {
          width: 380px;
          background: rgba(20, 20, 20, 0.85);
          border: 1px solid #1e1e1e;
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          box-shadow: 0 0 35px rgba(127, 94, 255, 0.35);
          backdrop-filter: blur(16px);
          animation: fadeIn 0.4s ease;
        }

        .logo-circle {
          width: 55px;
          height: 55px;
          border-radius: 50%;
          margin: 0 auto 18px;
          background: linear-gradient(135deg, #7f5eff, #5de1ff);
          box-shadow: 0 0 18px rgba(127, 94, 255, 0.7);
        }

        h2 {
          margin: 0 0 6px;
          font-weight: 700;
          color: #fff;
        }

        .sub {
          color: #888;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .sub a {
          color: #7f5eff;
          text-decoration: none;
        }

        input {
          width: 100%;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 12px;
          background: #131313;
          border: 1px solid #2a2a2a;
          color: #f1f1f1;
          font-size: 14px;
          transition: 0.2s;
        }

        input:focus {
          border-color: #7f5eff;
          box-shadow: 0 0 8px rgba(127, 94, 255, 0.4);
          outline: none;
        }

        button {
          width: 100%;
          padding: 12px;
          margin-top: 10px;
          background: linear-gradient(90deg, #7f5eff, #5de1ff);
          border: none;
          border-radius: 6px;
          font-weight: 700;
          cursor: pointer;
          color: white;
          transition: 0.2s;
          box-shadow: 0 0 18px rgba(127, 94, 255, 0.45);
        }

        button:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }

        .err {
          color: #ff6b6b;
          font-size: 14px;
          margin-bottom: 8px;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
        </div>
    );
}
