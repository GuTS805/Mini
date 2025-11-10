import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Home() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [me, setMe] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setMe(d))
      .catch(() => {});
  }, [token]);

  return (
    <div className="screen" style={{ position: "relative" }}>
      <div className="topbar" style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
        <div className="brand"><span className="dot" /> MINDMASH</div>
        <div className="navlinks">
          {token && me && (
            <div className="pill">Tier <span className="value">{me.rank}</span> • <span className="value">{me.points}</span> pts</div>
          )}
          {!token && <Link className="navlink" to="/login">Login</Link>}
        </div>
      </div>

      <div className="center-col">
        <div className="h-hero title-hero glow float">Mindmash</div>
        <div className="h-sub">Multiplayer Coding Battle Arena ⚔️</div>
        <Link to={token ? "/play" : "/login"} className="mt-16">
          <button className="btn btn-primary btn-glow">Enter Arena</button>
        </Link>
      </div>
    </div>
  );
}
