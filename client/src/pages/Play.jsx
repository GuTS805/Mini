import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

export default function Play() {
  console.log("✅ Play.jsx Loaded");

  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const [status, setStatus] = useState("idle"); // idle | queued | matching
  const [socket, setSocket] = useState(null);
  const [pendingQueue, setPendingQueue] = useState(false);

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ["websocket"], reconnectionAttempts: 5, timeout: 5000 });
    setSocket(s);

    // identify user with token
    const token = localStorage.getItem("token");
    if (token) s.emit("identify", token);

    s.on("connect", () => {
      console.log("[Play] socket connected", s.id);
      if (pendingQueue) {
        console.log("[Play] emitting queued after connect");
        s.emit("queue");
        setPendingQueue(false);
      }
    });

    s.on("queued", () => {
      console.log("[Play] queued ack");
      setStatus("queued");
    });

    // safety: if not queued within 2s after asking, try once more
    s.on("connect", () => {
      if (status === "matching") {
        setTimeout(() => {
          if (status === "matching") {
            console.log("[Play] retrying queue emit");
            s.emit("queue");
          }
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
    if (status !== "idle") return; // prevent duplicate
    setStatus("matching");
    if (socket.connected) {
      console.log("[Play] emitting queue (connected)");
      socket.emit("queue");
    } else {
      console.log("[Play] will queue after connect");
      setPendingQueue(true);
    }
  };

  const cancelMatch = () => {
    if (!socket) return;
    socket.emit("cancel_queue");
    setStatus("idle");
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>🏆 Enter Arena</h1>

        <input
          placeholder="Enter Room Code"
          style={styles.input}
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />
        <button style={styles.btnPurple} onClick={joinRoom}>Join Room</button>

        <div style={styles.or}>OR</div>

        <button style={styles.btnBlue} onClick={createRoom}>Create New Room 🔥</button>

        <div style={{ margin: "25px 0", height: 1, background: "#222" }} />

        {status === "idle" && (
          <button style={styles.find} onClick={findMatch}>🔎 Find Match</button>
        )}

        {status !== "idle" && (
          <button style={styles.cancel} onClick={cancelMatch}>
            {status === "matching" ? "Finding Opponent..." : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0a0a12",
    color: "white",
  },
  card: {
    width: 420,
    background: "#14131f",
    border: "1px solid #252538",
    borderRadius: 14,
    padding: "32px 28px",
    boxShadow: "0 0 25px rgba(127,94,255,.25)",
    textAlign: "center",
  },
  title: { marginBottom: 24, fontWeight: 800 },
  input: {
    width: "100%",
    padding: "14px 12px",
    background: "#0d0d17",
    color: "white",
    border: "1px solid #2a2845",
    borderRadius: 8,
    marginBottom: 14,
  },
  btnPurple: {
    width: "100%",
    padding: "14px",
    background: "#7f5eff",
    border: "none",
    borderRadius: 8,
    color: "white",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "15px",
  },
  or: { margin: "14px 0", opacity: 0.6 },
  btnBlue: {
    width: "100%",
    padding: "14px",
    background: "#5de1ff",
    border: "none",
    borderRadius: 8,
    color: "#0a0a12",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "15px",
  },
  find: {
    width: "100%",
    padding: "14px",
    background: "#18c964",
    border: "none",
    borderRadius: 8,
    color: "#0a0a12",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "16px",
  },
  cancel: {
    width: "100%",
    padding: "14px",
    background: "#33334d",
    border: "none",
    borderRadius: 8,
    color: "white",
    cursor: "pointer",
    fontWeight: "700",
  },
};
