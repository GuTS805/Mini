import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Room from "./pages/Room";
import Play from "./pages/Play";

function RequireAuth({ children }){
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function ProfilePage(){
  return (
    <div className="screen page">
      <div className="card glass" style={{ maxWidth: 720 }}>
        <h2 style={{ marginTop: 0 }}>Profile</h2>
        <div className="stack-12">
          <div className="pill">Username <span className="value">mindmash_user</span></div>
          <div className="pill">Rank <span className="value">Bronze</span></div>
          <div className="pill ok">Wins <span className="value">12</span></div>
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
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/play" element={<RequireAuth><Play /></RequireAuth>} />
      <Route path="/room/:id" element={<RequireAuth><Room /></RequireAuth>} />

      <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
      <Route path="/achievements" element={<RequireAuth><AchievementsPage /></RequireAuth>} />
      <Route path="/leaderboard" element={<RequireAuth><LeaderboardPage /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
