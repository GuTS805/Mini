import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "https://mini-8.onrender.com/";

export default function Achievements() {
  const navigate = useNavigate();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [me, setMe] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setMe(d))
      .catch(() => { });
  }, [token]);

  const wins = me?.wins ?? 0;
  const points = me?.points ?? 0;
  const streak = me?.streak ?? 0;

  const ACHS = [
    { key: 'streak_5', icon: '🔥', name: 'Keep it lit', desc: 'Maintain a 5-day streak', goal: 5, value: streak },
    { key: 'streak_15', icon: '🔥', name: 'On fire', desc: 'Maintain a 15-day streak', goal: 15, value: streak },
    { key: 'wins_10', icon: '🏆', name: 'First Blood', desc: 'Win 10 matches', goal: 10, value: wins },
    { key: 'wins_50', icon: '🏆', name: 'Arena Veteran', desc: 'Win 50 matches', goal: 50, value: wins },
    { key: 'points_500', icon: '💎', name: 'Collector', desc: 'Earn 500 points', goal: 500, value: points },
    { key: 'points_2000', icon: '💎', name: 'Treasure Hunter', desc: 'Earn 2000 points', goal: 2000, value: points },
    { key: 'solver_10', icon: '🧠', name: 'Problem Solver', desc: 'Solve 10 problems', goal: 10, value: Math.floor(points / 50) },
    { key: 'speed_3', icon: '⚡', name: 'Speed Coder', desc: 'Win 3 matches under 1 minute', goal: 3, value: 0 },
  ];

  return (
    <div className="screen page" style={{ position: 'relative', alignItems: 'flex-start' }}>
      <div className="topbar" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <Link to="/" className="brand"><img src="/mindmash-logo.png" alt="Mindmash" className="logo" /><span className="brand-text">MINDMASH</span></Link>
        <div className="navlinks">
          <Link className="navlink" to="/home">Home</Link>
          <Link className="navlink" to="/leaderboard"><img src="/5th.png" alt="" className="nav-ico" />Leaderboard</Link>
          <Link className="navlink" to="/play">Play</Link>
          <Link className="navlink" to="/tier">Tier</Link>
          {token && <button className="navlink logout" onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>Logout</button>}
        </div>
      </div>

      <div className="home-wrap" style={{ marginTop: 84 }}>
        <h2 style={{ marginTop: 0 }}>Achievements</h2>
        <section className="ach-grid">
          {ACHS.map(a => {
            const pct = Math.min(100, Math.round((a.value / a.goal) * 100));
            const done = a.value >= a.goal;
            return (
              <div key={a.key} className={`ach-card card glass ${done ? 'ach-done' : ''}`}>
                <div className="ach-head">
                  <div className="ach-icon">{a.icon}</div>
                  <div>
                    <div className="ach-name">{a.name}</div>
                    <div className="h-sub" style={{ fontSize: 12 }}>{a.desc}</div>
                  </div>
                </div>
                <div className="ach-progress">
                  <div className="ach-bar"><span style={{ width: pct + '%' }} /></div>
                  <div className="ach-meta">{a.value} / {a.goal}</div>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
