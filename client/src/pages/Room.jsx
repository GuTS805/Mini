import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Editor from "@monaco-editor/react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const languageMap = { javascript:63, python:71, cpp:54, c:50, java:62 };

export default function Room() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(`// Implement solve(n) and return the answer\nfunction solve(n){\n  if(n===0) return 1;\n  return n*solve(n-1);\n}`);
  const [output, setOutput] = useState("Run code to see result...");
  const [status, setStatus] = useState(""); // WIN | LOSE | ""
  const [opponent, setOpponent] = useState(false);

  // Auto-hide WIN/LOSE banner after 5 seconds
  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(""), 5000);
    return () => clearTimeout(t);
  }, [status]);

  // problem from matchmaking or fallback
  const stored = sessionStorage.getItem("MM_PROBLEM");
  const fallback = { title:"Factorial of 5", description:"Return factorial(5).", expectedOutput:"120" };
  const [problem] = useState(stored ? JSON.parse(stored) : fallback);

  useEffect(() => {
    const s = io(SOCKET_URL);
    setSocket(s);
    s.emit("join_room", id);
    s.on("player_joined", ()=> setOpponent(true));
    s.on("opponent_won", ()=> setStatus("LOSE"));
    s.on("winner_confirmed", ()=> setStatus("WIN"));
    return ()=> { s.close(); };
  }, [id]);

  const runCode = async () => {
    try {
      const langId = languageMap[language];
      // Use test runner for JS/Python
      if (language === "javascript" || language === "python") {
        const r = await axios.post(`${API_URL}/runProblem`, {
          code,
          language_id: langId,
          problemId: "factorial-5",
        }, { headers:{ "Content-Type":"application/json" } });

        if (r.data?.error) {
          setOutput(`Error: ${r.data.error}`);
          return;
        }

        const { passed, total, results } = r.data;
        const lines = (results || []).map(x => `${x.pass ? "✅" : "❌"} input=${x.input} expected=${x.expected} got=${x.got}`).join("\n");
        setOutput(`Tests passed ${passed}/${total}\n${lines}`);
        if (passed === total) socket?.emit("win_attempt", { roomId:id });
        return;
      }

      // Fallback: raw run for other languages
      const res = await axios.post(`${API_URL}/run`, {
        code, language_id: langId
      }, { headers:{ "Content-Type":"application/json" } });
      const result = (res.data.output || "").trim();
      setOutput(result || "No Output");
      if (result === String(problem.expectedOutput)) socket?.emit("win_attempt", { roomId:id });
    } catch (e) {
      setOutput("⚠ Server Execution Error");
    }
  };

  return (
    <div className="arena">
      <header className="nav">
        <div className="brand"><span className="dot" /> MINDMASH</div>
        <div className="right">
          <div className="stats">
            <div className="pill"><span className="label">ROOM</span><span className="value">#{id?.toUpperCase()}</span></div>
            <div className={`pill ${opponent ? "ok":"warn"}`}><span className="label">OPPONENT</span><span className="value">{opponent?"JOINED":"WAITING..."}</span></div>
            <div className="pill"><span className="label">MODE</span><span className="value">1v1</span></div>
          </div>
          <div className="profile">
            <button className="avatar" onClick={()=>setMenuOpen(v=>!v)}>MM</button>
            {menuOpen && (
              <div className="menu">
                <button onClick={()=>{ navigate('/home'); setMenuOpen(false); }}>Profile</button>
                <button onClick={()=>{ localStorage.removeItem('token'); navigate('/login'); }}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="grid">
        <section className="left">
          <div className="card">
            <h2>⚔ {problem.title}</h2>
            <p style={{opacity:.85}}>{problem.description}</p>

            <div style={{display:"flex",gap:8,marginTop:12}}>
              <select value={language} onChange={(e)=>setLanguage(e.target.value)}
                style={{background:"#0e0e18",color:"#fff",border:"1px solid #2a2845",padding:"8px 10px",borderRadius:6}}>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="java">Java</option>
              </select>
              <button className="btn-run" onClick={runCode}>▶ Run Code</button>
            </div>
          </div>

          <div className="card">
            <div className="card-head">Output</div>
            <pre className="console">{output}</pre>
          </div>
        </section>

        <section className="right">
          <div className="editor-wrap">
            <Editor
              height="100%"
              theme="vs-dark"
              language={language}
              value={code}
              onChange={(v)=>setCode(v ?? "")}
              options={{ minimap:{enabled:false}, fontSize:15 }}
            />
          </div>
        </section>
      </main>

      {status && (
        <div className={`banner ${status==="WIN"?"win":"lose"}`}>
          {status==="WIN" ? "🏆 YOU WIN!" : "❌ YOU LOSE!"}
        </div>
      )}

      <style>{`
        :root{ --bg:#0b0b12; --panel:#0f0f1a; --ink:#ecebf6; --muted:#9da0b8; --accent:#7f5eff; --good:#58ff9b; --bad:#ff6b6b; }
        *{margin:0;padding:0;box-sizing:border-box;}
        body,html,#root,.arena{height:100%;background:var(--bg);color:var(--ink);font-family:Inter, sans-serif;}
        .nav{display:flex;justify-content:space-between;padding:14px 22px;border-bottom:1px solid #1c1c2b;}
        .brand{font-weight:700;display:flex;align-items:center;gap:8px;}
        .dot{width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 10px var(--accent);}
        .right{display:flex;align-items:center;gap:12px;}
        .stats{display:flex;gap:10px;}
        .profile{position:relative;}
        .avatar{width:34px;height:34px;border-radius:50%;border:1px solid #2a2a44;background:#0f0f1a;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:800;box-shadow:0 0 12px rgba(127,94,255,.25)}
        .menu{position:absolute;right:0;top:42px;background:#141326;border:1px solid #2a2a44;border-radius:10px;box-shadow:0 12px 28px rgba(0,0,0,.35);min-width:160px;overflow:hidden;z-index:20}
        .menu button{width:100%;text-align:left;background:transparent;border:0;color:#ecebf6;padding:10px 12px;cursor:pointer}
        .menu button:hover{background:#1a1930}
        .pill{background:#11101a;padding:6px 10px;border-radius:6px;font-size:12px;}
        .pill.ok .value{color:var(--good);} .pill.warn .value{color:#ffe27a;}
        .grid{display:grid;grid-template-columns:40% 60%;height:calc(100% - 55px);}
        .left,.right{padding:14px;}
        .card{background:var(--panel);padding:14px;border-radius:8px;margin-bottom:14px;border:1px solid #23233a;}
        .btn-run{padding:10px 14px;background:var(--accent);border:none;color:#fff;border-radius:6px;cursor:pointer;font-weight:800;}
        .console{min-height:120px;background:#0a0a12;padding:10px;border-radius:8px;overflow:auto;border:1px solid #202038;}
        .editor-wrap{height:100%;background:#0c0c16;border-radius:8px;border:1px solid #1e1e2f;}
        .banner{position:fixed;inset:0;display:flex;justify-content:center;align-items:center;font-size:64px;font-weight:900;background:rgba(0,0,0,0.55)}
        .banner.win{color:var(--good);} .banner.lose{color:var(--bad);}
        @media(max-width:1024px){ .grid{ grid-template-columns:1fr; } .editor-wrap{ height:55vh; } }
      `}</style>
    </div>
  );
}
