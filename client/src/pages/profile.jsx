import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Profile(){
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [me, setMe] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => setMe(d))
      .catch(async (e) => {
        try { const t = await e.text(); setErr(t || 'Failed to load profile'); }
        catch { setErr('Failed to load profile'); }
      });
  }, [token]);


  // Simple mocked submissions heatmap (last ~28 weeks x 5 weekdays)
  const weeks = 28;
  const days = 5; // Mon-Fri display
  const heat = Array.from({ length: days }, (_, r) => (
    Array.from({ length: weeks }, (_, c) => ((r*weeks+c+7) % 9))
  ));

  return (
    <div className="screen page" style={{ position: 'relative', alignItems:'flex-start' }}>
      <div className="topbar" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <Link to="/" className="brand"><img src="/mindmash-logo.png" alt="Mindmash" className="logo" /><span className="brand-text">MINDMASH</span></Link>
        <div className="navlinks">
          {token && me && (
            <div className="pill">Tier <span className="value">{me.rank}</span> • <span className="value">{me.points}</span> pts</div>
          )}
          <Link className="navlink" to="/home">Home</Link>
          <Link className="navlink" to="/achievements">Achievements</Link>
          <Link className="navlink" to="/leaderboard">Leaderboard</Link>
        </div>
      </div>

      <div className="profile-wrap">
        {/* Left column */}
        <section className="card glass">
          <div className="stack-12">
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div className="avatar" style={{ width:56, height:56, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900 }}> {(me?.username || 'MM').slice(0,2).toUpperCase()} </div>
              <div>
                <div style={{ fontWeight:900, fontSize:20 }}>{me?.username || 'Player'}</div>
                <div className="h-sub" style={{ fontSize:13 }}>@{me?.username || 'user'} • Rank {me?.rank || 'Bronze'}</div>
              </div>
            </div>

            <div className="info-grid">
              <div><span className="label">Points</span><div className="value">{me?.points ?? 0}</div></div>
              <div><span className="label">Wins</span><div className="value">{me?.wins ?? 0}</div></div>
              <div><span className="label">Losses</span><div className="value">{me?.losses ?? 0}</div></div>
              <div><span className="label">Streak</span><div className="value">{me?.streak ?? 0} days</div></div>
            </div>

            <div className="card-subhead">Submissions Heat Map</div>
            <div className="heatmap">
              {heat.map((row, r) => (
                <div className="heat-row" key={r}>
                  {row.map((v, c) => (
                    <div key={c} className="heat-cell" style={{ opacity: 0.2 + (v/9)*0.8 }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right column */}
        <section className="right-col">
          <div className="card glass">
            <div className="card-subhead">Skill tests</div>
            <div className="h-sub" style={{fontSize:13}}>Build a strong profile by taking skill tests.</div>
            <button className="btn btn-muted w-100 mt-16">View skill tests</button>
          </div>

          <div className="card glass">
            <div className="card-subhead">Badges</div>
            <div className="h-sub" style={{fontSize:13}}>No badges yet.</div>
          </div>
        </section>
      </div>
    </div>
  );
}
