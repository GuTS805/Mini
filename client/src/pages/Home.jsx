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

  const mockStats = { active: 1284, matchesToday: 342, problems: 37 };
  const mockLeaders = [
    { name: 'NovaCoder', rating: 1520 },
    { name: 'ByteKnight', rating: 1485 },
    { name: 'AlgoFox', rating: 1410 },
    { name: 'SyntaxSam', rating: 1390 },
    { name: 'LoopLynx', rating: 1344 },
  ];

  return (
    <div className="screen page" style={{ position: "relative", alignItems: 'flex-start' }}>
      <div className="topbar" style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
        <Link to="/" className="brand"><img src="/mindmash-logo.png" alt="Mindmash" className="logo" /><span className="brand-text">MINDMASH</span></Link>
        <div className="navlinks">
          {token && me && (
            <div className="pill">Tier <span className="value">{me.rank}</span> • <span className="value">{me.points}</span> pts</div>
          )}
          {!token && <Link className="navlink" to="/login">Login</Link>}
        </div>
      </div>

      <div className="home-wrap">
        {/* Hero */}
        <section className="hero">
          <div>
            <div className="h-hero title-hero glow">Mindmash</div>
            <div className="h-sub" style={{ marginTop: 6 }}>Real-time 1v1 coding battles, rankings, and daily streaks.</div>
            <div className="stack-12" style={{ marginTop: 16 }}>
              <Link to={token ? "/play" : "/login"}><button className="btn btn-primary btn-glow">Enter Arena</button></Link>
              {!token && <Link to="/signup"><button className="btn btn-accent">Create Account</button></Link>}
            </div>
          </div>
          <div className="hero-stats">
            <div className="pill">Active <span className="value">{mockStats.active}</span></div>
            <div className="pill ok">Matches Today <span className="value">{mockStats.matchesToday}</span></div>
            <div className="pill">Problems <span className="value">{mockStats.problems}</span></div>
          </div>
        </section>

        {/* Features */}
        <section className="features">
          <div className="card glass"><h3>⚡ Real-time 1v1</h3><p>Instant matchmaking with Socket.IO and a 3-round scoring system.</p></div>
          <div className="card glass"><h3>🧠 Language Support</h3><p>Judge0-powered runs with local JS fast path for speed and reliability.</p></div>
          <div className="card glass"><h3>🏅 Ranks & Streaks</h3><p>Earn points, rank up, and keep your daily streak burning.</p></div>
        </section>

        <div className="home-grid">
          {/* Leaderboard (mock) */}
          <section className="card glass">
            <div className="h-sub" style={{ marginBottom: 8 }}>Top Players</div>
            <div className="stack-12">
              {mockLeaders.map((u, i) => (
                <div key={u.name} className="leader-row">
                  <div className="rank">#{i + 1}</div>
                  <div className="name">{u.name}</div>
                  <div className="rating">{u.rating}</div>
                </div>
              ))}
            </div>
            <Link to="/leaderboard"><button className="btn btn-muted w-100 mt-16">Open Leaderboard</button></Link>
          </section>

          {/* Streak teaser */}
          <section className="card glass streak-card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:800, fontSize:18 }}>Keep your flame alive</div>
                <div className="h-sub" style={{ fontSize:13, marginTop:4 }}>Log in daily to grow your streak.</div>
              </div>
              <div className="pill ok">Streak <span className="value">{me?.streak || 0}</span> days</div>
            </div>
            <div className="streak-days">
              {Array.from({ length: 5 }).map((_, i) => {
                const dayOn = (me?.streak || 0) > i;
                return <div key={i} className={'streak-day' + (dayOn ? ' on' : '')}>{i + 1}</div>;
              })}
            </div>
            <Link to="/play"><button className="btn btn-primary w-100">Play Now</button></Link>
          </section>
        </div>
      </div>
    </div>
  );
}
