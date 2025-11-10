import { Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Room from "./pages/Room";
import Play from "./pages/Play";

function PublicOnly({ children }){
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) return <Navigate to="/home" replace />;
  return children;
}

function RootRedirect(){
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return <Navigate to={token ? "/home" : "/login"} replace />;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function RequireAuth({ children }){
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  // Immediate redirect when no token
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;

  // Validate token with /me
  useEffect(() => {
    fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok)
      .then(isOk => { setOk(!!isOk); setReady(true); if (!isOk) localStorage.removeItem('token'); })
      .catch(() => { localStorage.removeItem('token'); setOk(false); setReady(true); });
  }, [token]);

  if (!ready) return <div className="screen page" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>Checking session…</div>;
  if (!ok) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function ProfilePage(){
  const [me, setMe] = useState(null);
  const [err, setErr] = useState("");
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => setMe(d))
      .catch(async (e) => {
        try { const t = await e.text(); setErr(t || 'Failed to load profile'); }
        catch { setErr('Failed to load profile'); }
      });
  }, [token]);

  return (
    <div className="screen page" style={{ position: 'relative' }}>
      <div className="topbar" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <div className="brand"><span className="dot" /> MINDMASH</div>
        <div className="navlinks">
          {token && me && (
            <div className="pill">Tier <span className="value">{me.rank}</span> • <span className="value">{me.points}</span> pts</div>
          )}
          <Link className="navlink" to="/home">Home</Link>
          <Link className="navlink" to="/achievements">Achievements</Link>
          <Link className="navlink" to="/leaderboard">Leaderboard</Link>
        </div>
      </div>

      <div className="center-col" style={{ width: '100%' }}>
        <div className="card glass" style={{ width: 'min(720px, 96%)' }}>
          <div className="h-hero title-hero" style={{ marginTop: 0, marginBottom: 6 }}>Profile</div>
          <div className="h-sub" style={{ marginBottom: 16 }}>Your arena identity</div>
          <div className="stack-12">
            {me ? (
              <>
                <div className="pill">Username <span className="value">{me.username}</span></div>
                <div className="pill">Rank <span className="value">{me.rank}</span></div>
                <div className="pill">Points <span className="value">{me.points}</span></div>
                <div className="pill">Rating <span className="value">{me.rating}</span></div>
                <div className="pill">Wins <span className="value">{me.wins}</span></div>
                <div className="pill">Losses <span className="value">{me.losses}</span></div>
              </>
            ) : (
              <div style={{ opacity: .8 }}>{err || 'Loading...'}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AchievementsPage(){
  return (
    <div className="screen page">
      <div className="card glass" style={{ maxWidth: 720 }}>
        <h2 style={{ marginTop: 0 }}>Achievements</h2>
        <div className="stack-12">
          <div className="pill ok">Win Streak <span className="value">3</span></div>
          <div className="pill">Problem Solver <span className="value">12</span></div>
          <div className="pill">Speed Coder <span className="value">2</span></div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardPage(){
  return (
    <div className="screen page">
      <div className="card glass" style={{ maxWidth: 720 }}>
        <h2 style={{ marginTop: 0 }}>Leaderboard</h2>
        <div className="stack-12">
          <div>#1 • NovaCoder — 1520</div>
          <div>#2 • ByteKnight — 1485</div>
          <div>#3 • AlgoFox — 1410</div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />

      <Route path="/play" element={<RequireAuth><Play /></RequireAuth>} />
      <Route path="/room/:id" element={<RequireAuth><Room /></RequireAuth>} />

      <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
      <Route path="/achievements" element={<RequireAuth><AchievementsPage /></RequireAuth>} />
      <Route path="/leaderboard" element={<RequireAuth><LeaderboardPage /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
