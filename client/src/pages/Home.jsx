import { Link } from "react-router-dom";

export default function Home() {
    return (
        <div style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center"
        }}>
            <h1 style={{
                fontSize: "48px",
                textShadow: "0 0 25px #7f5eff"
            }}>
                MINDMASH
            </h1>

            <p style={{ fontSize: "18px", opacity: 0.9 }}>
                Multiplayer Coding Battle Arena ⚔️
            </p>

            <Link to="/play">
                <button>Enter Arena</button>
            </Link>
        </div>
    );
}
