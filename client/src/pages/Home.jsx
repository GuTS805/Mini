import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="screen">
      <div className="center-col">
        <div className="h-hero title-hero glow float">Mindmash</div>
        <div className="h-sub">Multiplayer Coding Battle Arena ⚔️</div>
        <Link to="/play" className="mt-16">
          <button className="btn btn-primary btn-glow">Enter Arena</button>
        </Link>
      </div>
    </div>
  );
}
