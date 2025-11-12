import { Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Room from "./pages/Room";
import Play from "./pages/Play";
import Profile from "./pages/profile";
import Achievements from "./pages/Achievements";
import Leaderboard from "./pages/Leaderboard";
import Tier from "./pages/Tier";

function PublicOnly({ children }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) return <Navigate to="/home" replace />;
  return children;
}

function RootRedirect() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return <Navigate to={token ? "/home" : "/login"} replace />;
}

const API_URL = import.meta.env.VITE_API_URL || "https://mini-8.onrender.com/";

function RequireAuth({ children }) {
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

  if (!ready) return <div className="screen page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Checking session…</div>;
  if (!ok) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

/* Profile, Achievements, and Leaderboard are now standalone pages under ./pages */

/* Achievements page moved to ./pages/Achievements */

/* Leaderboard page moved to ./pages/Leaderboard */

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />

      <Route path="/play" element={<RequireAuth><Play /></RequireAuth>} />
      <Route path="/room/:id" element={<RequireAuth><Room /></RequireAuth>} />

      <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="/achievements" element={<RequireAuth><Achievements /></RequireAuth>} />
      <Route path="/leaderboard" element={<RequireAuth><Leaderboard /></RequireAuth>} />
      <Route path="/tier" element={<RequireAuth><Tier /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
