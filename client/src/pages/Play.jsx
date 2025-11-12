import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { io } from "socket.io-client";

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || "http://localhost:5000").replace(/\/$/, "");
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function Play() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const [status, setStatus] = useState("idle"); // idle | queued | matching
  const [socket, setSocket] = useState(null);
  const [pendingQueue, setPendingQueue] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [me, setMe] = useState(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [modalCode, setModalCode] = useState("");
  const [modalMode, setModalMode] = useState("join"); // 'join' | 'create'
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
      .catch(() => { });
  }, [token]);

  const joinRoom = () => {
    if (!roomCode.trim()) return;
    navigate(`/room/${roomCode.trim().toUpperCase()}`);
  };

  const createRoom = () => {
    setModalMode("create");
    setModalCode("");
    setJoinOpen(true);
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
        <Link to="/" className="brand"><img src="/mindmash-logo.png" alt="Mindmash" className="logo" /><span className="brand-text">MINDMASH</span></Link>
        <div className="navlinks">
          {me && (
            <div className="pill">Tier <span className="value">{me.rank}</span> • <span className="value">{me.points}</span> pts</div>
          )}
          {me ? (
            <>
              <Link className="navlink" to="/profile">Profile</Link>
              <Link className="navlink" to="/achievements">Achievements</Link>
              <Link className="navlink" to="/leaderboard"><img src="/4th.png" alt="" className="nav-ico" />Leaderboard</Link>
              <Link className="navlink" to="/tier">Tier</Link>
              <button className="navlink logout" onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>Logout</button>
              <div className="profile">
                <button className="avatar" onClick={() => setMenuOpen((v) => !v)}>{(me?.username ? me.username.slice(0, 2) : 'MM').toUpperCase()}</button>
                {menuOpen && (
                  <div className="menu">
                    <div style={{ padding: "10px 12px", borderBottom: "1px solid #262645", marginBottom: 6 }}>
                      <div style={{ fontWeight: 700 }}>@{me.username}</div>
                      <div style={{ opacity: .85, fontSize: 12, marginTop: 4 }}>Rank {me.rank} • {me.points} pts</div>
                      <div style={{ opacity: .7, fontSize: 12 }}>Rating {me.rating} • W {me.wins} / L {me.losses}</div>
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

      {joinOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setJoinOpen(false); }}>
          <div className="modal-card glass">
            <div className="h-hero title-hero" style={{ fontSize: 20, marginBottom: 8 }}>{modalMode === 'create' ? 'Create Room Code' : 'Enter Room Code'}</div>
            <input
              className="field"
              placeholder="e.g. ABCD1234"
              value={modalCode}
              onChange={(e) => setModalCode((e.target.value || "").toUpperCase())}
            />
            <div className="stack-12" style={{ marginTop: 12 }}>
              <button className="btn btn-primary w-100" onClick={() => {
                const code = (modalCode || "").trim();
                if (!/^[A-Z0-9]{4,10}$/.test(code)) { alert("Use 4-10 characters (A-Z, 0-9)"); return; }
                navigate(`/room/${code}`);
                setJoinOpen(false);
              }}>{modalMode === 'create' ? 'Create' : 'Join'}</button>
              <button className="btn btn-muted w-100" onClick={() => setJoinOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ width: 'min(1100px, 96%)' }}>
        <h1 className="h-hero title-hero glow" style={{ margin: '0 0 12px 0', textAlign: 'left' }}>ENTER ARENA</h1>
        <div className="arena-grid">
          <div className="stack-16">
            <div className="card glass neon" style={{ width: '100%' }}>
              <div className="stack-12" style={{ maxWidth: 480 }}>
                <button className="btn btn-primary btn-glow w-100" onClick={() => { setModalMode("join"); setJoinOpen(true); setModalCode(""); }}>Enter Room Code</button>
              </div>
            </div>
            <div className="card glass" style={{ width: '100%' }}>
              <div className="stack-12" style={{ maxWidth: 480 }}>
                <button className="btn btn-accent w-100" onClick={createRoom}>Create Room with Code 🔥</button>
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

          <div className="card glass streak-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>Streak Flame</div>
                <div className="h-sub" style={{ fontSize: 13, marginTop: 4 }}>Ignite your daily coding streak!</div>
              </div>
              <div className="pill ok">Streak <span className="value">{me?.streak || 0}</span> days</div>
            </div>

            <div className="streak-days">
              {Array.from({ length: 5 }).map((_, i) => {
                const dayOn = (me?.streak || 0) > i;
                return <div key={i} className={"streak-day" + (dayOn ? " on" : "")}>{i + 1}</div>;
              })}
            </div>

            <div className="mini-calendar">
              <div className="cal-head">This Week</div>
              <div className="cal-grid">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => {
                  const today = new Date();
                  const idx = today.getDay();
                  const isToday = i === idx;
                  return <div key={i} className={"cal-cell" + (isToday ? " today" : "")}>{d}</div>;
                })}
              </div>
            </div>

            <button className="btn btn-muted w-100 mt-16">What is a streak flame?</button>
          </div>
        </div>
      </div>

    </div>
  );
}
