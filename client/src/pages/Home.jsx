import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function Home() {
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
          {token ? (
            <>
              <Link className="navlink" to="/home">Home</Link>
              <Link className="navlink" to="/play">Play</Link>
              <Link className="navlink" to="/leaderboard"><img src="/5th.png" alt="" className="nav-ico" />Leaderboard</Link>
              <Link className="navlink" to="/achievements">Achievements</Link>
              <Link className="navlink" to="/tier">Tier</Link>
              <Link className="navlink" to="/profile">Profile</Link>
              <button className="navlink logout" onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>Logout</button>
            </>
          ) : (
            <>
              <Link className="navlink" to="/login">Login</Link>
              <Link className="navlink" to="/signup">Sign up</Link>
              <Link className="navlink" to="/leaderboard">Leaderboard</Link>
              <Link className="navlink" to="/tier">Tier</Link>
            </>
          )}
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
              <div className="hero-stats">
                <div className="pill">Active <span className="value">{mockStats.active}</span></div>
                <div className="pill ok">Matches Today <span className="value">{mockStats.matchesToday}</span></div>
                <div className="pill">Problems <span className="value">{mockStats.problems}</span></div>
              </div>
            </div>
          </div>
          <img src="/berserk_no_bg.png" alt="" className="hero-art" />
        </section>

        {/* Features */}
        <section className="features">
          <div className="card glass"><h3>⚡ Real-time 1v1</h3><p>Instant matchmaking with Socket.IO and a 3-round scoring system.</p></div>
          <div className="card glass"><h3>🧠 Language Support</h3><p>Judge0-powered runs with local JS fast path for speed and reliability.</p></div>
          <div className="card glass"><h3>🏅 Ranks & Streaks</h3><p>Earn points, rank up, and keep your daily streak burning.</p></div>
        </section>

        {/* About */}
        <section className="card glass" style={{ marginTop: 8 }}>
          <h3 style={{ marginTop: 0 }}>About Mindmash</h3>
          <p className="h-sub" style={{ marginTop: 6 }}>
            Mindmash is a competitive coding arena where you battle head‑to‑head in fast, fair 1v1 matches. Our goal is to make practicing algorithms fun and addictive—
            match instantly, solve problems under pressure, track your progress with ranks and streaks, and climb the leaderboard. Whether you’re sharpening skills for interviews
            or just love a challenge, Mindmash turns daily practice into a game.
          </p>
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

          {/* Right image card */}
          <section className="card glass">
            <img src="/2nd.png" alt="" className="grid-art" />
          </section>

          {/* Far-right image card */}
          <section className="card glass">
            <img src="/3rd.png" alt="" className="grid-art" />
          </section>
        </div>
        {/* Footer */}
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-cols">
              <div>
                <div className="foot-head">Contact Information</div>
                <div className="foot-item" style={{ fontWeight: 800 }}>⚡ Mindmash Support HQ</div>
                <div className="foot-item">Got issues? Found a bug? Want to collaborate?</div>
                <div className="foot-item" style={{ marginTop: 8 }}>📧 Mail us: <a href="mailto:support@mindmash.tech" style={{ color: 'var(--ink)', textDecoration: 'none' }}>support@mindmash.tech</a></div>
                <div className="foot-item">🌍 Website: <a href="https://www.mindmash.tech" target="_blank" rel="noreferrer" style={{ color: 'var(--ink)', textDecoration: 'none' }}>www.mindmash.tech</a></div>
              </div>

              <div>
                <div className="foot-head">Navigate</div>
                <div className="foot-links">
                  <Link to="/home">Home</Link>
                  <Link to="/play">Play</Link>
                  <Link to="/leaderboard">Leaderboard</Link>
                  <Link to="/tier">Tier</Link>
                  <Link to="/achievements">Achievements</Link>
                  <Link to="/profile">Profile</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="foot-bottom">© {new Date().getFullYear()} Mindmash. All rights reserved.</div>
        </footer>
      </div>
    </div>
  );
}
