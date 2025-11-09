import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Room from "./pages/Room";
import Play from "./pages/Play";

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
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/home" element={<Home />} />
      <Route path="/play" element={<Play />} />
      <Route path="/room/:id" element={<Room />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/achievements" element={<AchievementsPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
    </Routes>
  );
}
