import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Play() {
    const [roomId, setRoomId] = useState("");
    const navigate = useNavigate();

    const handleJoin = () => {
        if (!roomId.trim()) return;
        navigate(`/room/${roomId.trim().toUpperCase()}`);
    };

    const handleCreate = () => {
        const id = Math.random().toString(36).substring(2, 6).toUpperCase();
        navigate(`/room/${id}`);
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>🏆 Enter Arena</h1>

            <div style={styles.card}>
                <input
                    type="text"
                    placeholder="Enter Room Code"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    style={styles.input}
                />

                <button style={styles.join} onClick={handleJoin}>
                    Join Room
                </button>

                <div style={styles.sep}>OR</div>

                <button style={styles.create} onClick={handleCreate}>
                    Create New Room 🔥
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        height: "100vh",
        background: "#0b0b12",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
    },
    title: { fontSize: "36px", marginBottom: "20px" },
    card: {
        padding: "24px 32px",
        borderRadius: "10px",
        background: "#151523",
        boxShadow: "0 0 18px rgba(127,94,255,0.4)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        width: "320px",
    },
    input: {
        padding: "12px",
        fontSize: "16px",
        background: "#0e0e18",
        border: "1px solid #2a2845",
        color: "white",
    },
    join: {
        padding: "12px",
        background: "#7f5eff",
        color: "white",
        cursor: "pointer",
        border: "none",
        fontWeight: "600",
    },
    sep: { textAlign: "center", opacity: 0.6, margin: "4px 0" },
    create: {
        padding: "12px",
        background: "#5de1ff",
        color: "#0b0b12",
        cursor: "pointer",
        border: "none",
        fontWeight: "600",
    },
};
