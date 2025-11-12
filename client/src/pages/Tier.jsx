import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export default function Tier() {
  const navigate = useNavigate();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [me, setMe] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setMe(d))
      .catch(() => {});
  }, [token]);

  const tiers = useMemo(() => ([
    { name: 'Bronze', min: 0 },
    { name: 'Silver', min: 500 },
    { name: 'Gold', min: 1000 },
    { name: 'Platinum', min: 2000 },
    { name: 'Diamond', min: 3500 },
    { name: 'Master', min: 5000 },
  ]), []);

  const points = me?.points ?? 0;
  const currentIndex = Math.max(0, tiers.findIndex(t => points >= t.min && points < (tiers[tiers.findIndex(x=>x.min===t.min)+1]?.min ?? Infinity)));
  const curr = tiers.reduce((acc, t) => (t.min <= points && t.min > (acc?.min ?? -1) ? t : acc), tiers[0]);
  const next = tiers.find(t => t.min > points) || null;
  const base = curr?.min ?? 0;
  const cap = next?.min ?? Math.max(points, base + 1);
  const need = Math.max(0, cap - points);
  const pct = Math.min(100, Math.max(0, Math.round(((points - base) / (cap - base)) * 100)));

  const size = 180;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="screen page" style={{ position: 'relative', alignItems: 'flex-start' }}>
      <div className="topbar" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <Link to="/" className="brand"><img src="/mindmash-logo.png" alt="Mindmash" className="logo" /><span className="brand-text">MINDMASH</span></Link>
        <div className="navlinks">
          <Link className="navlink" to="/home">Home</Link>
          <Link className="navlink" to="/play">Play</Link>
          <Link className="navlink" to="/leaderboard">Leaderboard</Link>
          <Link className="navlink" to="/achievements">Achievements</Link>
          <Link className="navlink" to="/profile">Profile</Link>
          {token && <button className="navlink logout" onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>Logout</button>}
        </div>
      </div>

      <div className="home-wrap" style={{ marginTop: 84 }}>
        <section className="card glass" style={{ display:'grid', gridTemplateColumns:'1fr', gap:16, alignItems:'center', justifyItems:'center' }}>
          <div style={{ display:'grid', gridTemplateColumns: 'auto 1fr', gap: 22, alignItems:'center', width:'100%' }}>
            <div style={{ position:'relative', width:size, height:size }}>
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size/2} cy={size/2} r={r} stroke="#23233a" strokeWidth={stroke} fill="none" />
                <circle cx={size/2} cy={size/2} r={r} stroke="url(#grad)" strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${dash} ${c}`} transform={`rotate(-90 ${size/2} ${size/2})`} />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--accent-2)" />
                    <stop offset="100%" stopColor="var(--accent)" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
                <div style={{ fontSize:28, fontWeight:900 }}>{pct}%</div>
                <div className="h-sub" style={{ fontSize:12 }}>to next tier</div>
              </div>
            </div>
            <div>
              <div style={{ fontWeight:900, fontSize:22 }}>{me?.rank || curr?.name || 'Bronze'}</div>
              <div className="h-sub" style={{ marginTop:6 }}>Points</div>
              <div style={{ fontWeight:900, fontSize:28 }}>{points}</div>
              <div className="hr" />
              <div className="h-sub" style={{ marginTop:4 }}>
                {next ? (
                  <>
                    Next: <span style={{ fontWeight:800 }}>{next.name}</span> at <span style={{ fontWeight:800 }}>{next.min}</span> pts
                  </>
                ) : (
                  <>Top tier reached</>
                )}
              </div>
              {next && (
                <div style={{ marginTop:8, fontWeight:800 }}>
                  Need {need} pts to reach {next.name}
                </div>
              )}
              <div className="stack-12" style={{ marginTop:14 }}>
                <Link to="/play"><button className="btn btn-primary">Play to earn points</button></Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
