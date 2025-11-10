import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Play() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const [status, setStatus] = useState("idle"); // idle | queued | matching
  const [socket, setSocket] = useState(null);
  const [pendingQueue, setPendingQueue] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [me, setMe] = useState(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ["websocket"], reconnectionAttempts: 5, timeout: 5000 });
    setSocket(s);

    const token = localStorage.getItem("token");
    if (token) s.emit("identify", token);

    s.on("connect", () => {
      if (pendingQueue) {
        s.emit("queue");
        setPendingQueue(false);
      }
    });

    s.on("queued", () => setStatus("queued"));

    s.on("connect", () => {
      if (status === "matching") {
        setTimeout(() => {
          if (status === "matching") s.emit("queue");
        }, 2000);
      }
    });

    s.on("match_found", ({ roomId, problem }) => {
      sessionStorage.setItem("MM_PROBLEM", JSON.stringify(problem));
      navigate(`/room/${roomId}`);
    });

    return () => {
      s.off("connect");
      s.off("queued");
      s.off("match_found");
      s.close();
    };
  }, [navigate]);

  // fetch Tier (rank/points)
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setMe(d))
      .catch(() => {});
  }, [token]);

  const joinRoom = () => {
    if (!roomCode.trim()) return;
    navigate(`/room/${roomCode.trim().toUpperCase()}`);
  };

  const createRoom = () => {
    const id = Math.random().toString(36).slice(2, 6).toUpperCase();
    navigate(`/room/${id}`);
  };

  const findMatch = () => {
    if (!socket) return;
    if (status !== "idle") return;
    setStatus("matching");
    if (socket.connected) {
      socket.emit("queue");
    } else {
      setPendingQueue(true);
    }
  };

  const cancelMatch = () => {
    if (!socket) return;
    socket.emit("cancel_queue");
    setStatus("idle");
  };

  return (
    <div className="screen" style={{ position: "relative" }}>
      {/* Topbar with profile at right */}
      <div className="topbar" style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
        <div className="brand"><span className="dot" /> MINDMASH</div>
        <div className="navlinks">
          {me && (
            <div className="pill">Tier <span className="value">{me.rank}</span> • <span className="value">{me.points}</span> pts</div>
          )}
          {me ? (
            <>
              <Link className="navlink" to="/profile">Profile</Link>
              <Link className="navlink" to="/achievements">Achievements</Link>
              <Link className="navlink" to="/leaderboard">Leaderboard</Link>
              <div className="profile">
                <button className="avatar" onClick={() => setMenuOpen((v) => !v)}>{(me?.username ? me.username.slice(0,2) : 'MM').toUpperCase()}</button>
                {menuOpen && (
                  <div className="menu">
                    <div style={{padding:"10px 12px", borderBottom:"1px solid #262645", marginBottom:6}}>
                      <div style={{fontWeight:700}}>@{me.username}</div>
                      <div style={{opacity:.85, fontSize:12, marginTop:4}}>Rank {me.rank} • {me.points} pts</div>
                      <div style={{opacity:.7, fontSize:12}}>Rating {me.rating} • W {me.wins} / L {me.losses}</div>
                    </div>
                    <button onClick={() => { setMenuOpen(false); navigate('/profile'); }}>Open Profile</button>
                    <button onClick={() => { localStorage.removeItem("token"); navigate("/login"); }}>Logout</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link className="navlink" to="/login">Login</Link>
          )}
        </div>
      </div>

      {/* Center main card */}
      <div className="card glass neon" style={{ width: 420, textAlign: "center" }}>
        <h1 className="h-hero title-hero glow">Enter Arena</h1>

        <div className="stack-12">
          <input
            className="field"
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <button className="btn btn-primary btn-glow w-100" onClick={joinRoom}>Join Room</button>

          <div className="hr" />

          <button className="btn btn-accent w-100" onClick={createRoom}>Create New Room 🔥</button>

          {status === "idle" && (
            <button className="btn btn-success w-100" onClick={findMatch}>🔎 Find Match</button>
          )}

          {status !== "idle" && (
            <button className="btn btn-muted w-100" onClick={cancelMatch}>
              {status === "matching" ? "Finding Opponent..." : "Cancel"}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
