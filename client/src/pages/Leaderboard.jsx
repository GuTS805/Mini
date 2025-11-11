import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Leaderboard(){
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/leaderboard`).then(r=>r.json()).then(setRows).catch(()=>setRows([]));
  }, []);

  return (
    <div className="screen page" style={{ position: 'relative', alignItems:'flex-start' }}>
      <div className="topbar" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <Link to="/" className="brand"><img src="/mindmash-logo.png" alt="Mindmash" className="logo" /><span className="brand-text">MINDMASH</span></Link>
        <div className="navlinks">
          <Link className="navlink" to="/home">Home</Link>
          <Link className="navlink" to="/play">Play</Link>
          <Link className="navlink" to="/achievements">Achievements</Link>
        </div>
      </div>

      <div className="home-wrap" style={{ marginTop: 84 }}>
        <div className="card glass" style={{ maxWidth: 780, width:'100%' }}>
          <h2 style={{ marginTop: 0 }}>Leaderboard</h2>
          <div className="stack-12">
            {rows.map((u, i) => (
              <div key={u._id || u.username + i} className="leader-row">
                <div className="rank">#{i+1}</div>
                <div className="name">{u.username}</div>
                <div className="rating">{u.rating}</div>
              </div>
            ))}
            {rows.length === 0 && <div style={{opacity:.85}}>No data yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
