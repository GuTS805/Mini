import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Editor from "@monaco-editor/react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const languageMap = { javascript:63, python:71, cpp:54, c:50, java:62 };

// Local problem list to rotate to a "next" problem
const LOCAL_PROBLEMS = [
  { id: "factorial-n", title: "Factorial of n", description: "Return factorial(n).", expectedOutput: "", difficulty: "Easy" },
  { id: "reverse-hello", title: "Reverse 'hello'", description: "Print the reverse of the string 'hello'.", expectedOutput: "olleh", difficulty: "Easy" },
  { id: "fib-10", title: "10th Fibonacci", description: "Print the 10th Fibonacci number (0-indexed: F0=0, F1=1).", expectedOutput: "55", difficulty: "Medium" },
];
const nextProblemOf = (id) => {
  const i = LOCAL_PROBLEMS.findIndex(p => p.id === id);
  if (i === -1) return LOCAL_PROBLEMS[0];
  return LOCAL_PROBLEMS[(i + 1) % LOCAL_PROBLEMS.length];
};

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
  const [attempts, setAttempts] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  // 3-round match state
  const [round, setRound] = useState(1);
  const TOTAL_ROUNDS = 3;
  const [me, setMe] = useState(null);
  // Terminal state
  const [termN, setTermN] = useState(5);
  const [termOut, setTermOut] = useState("");
  const [termBusy, setTermBusy] = useState(false);

  // Auto-hide WIN/LOSE banner after 5 seconds (triggered only on match_over)
  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(""), 5000);
    return () => clearTimeout(t);
  }, [status]);

  // Fetch /me to get user id for round_result
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios.get(`${API_URL}/me`, { headers:{ Authorization: `Bearer ${token}` }})
      .then(r => setMe(r.data))
      .catch(()=>{});
  }, []);

  // problem from matchmaking or fallback
  const stored = sessionStorage.getItem("MM_PROBLEM");
  const fallback = { id:"factorial-n", title:"Factorial of n", description:"Return factorial(n).", expectedOutput:"", difficulty:"Easy" };
  const [problem, setProblem] = useState(stored ? JSON.parse(stored) : fallback);

  useEffect(() => {
    const s = io(SOCKET_URL);
    setSocket(s);
    s.emit("join_room", id);
    s.on("player_joined", ()=> setOpponent(true));
    // Legacy single-attempt events kept but we won't use them for round wins
    s.on("opponent_won", ()=> {});
    s.on("winner_confirmed", ()=> {});
    // Final match result after 3 rounds
    s.on("match_over", (payload) => {
      const myId = me?._id;
      if (!myId) return; // wait until /me resolves
      if (payload.winner === null) { setStatus(""); return; }
      setStatus(payload.winner === myId ? "WIN" : "LOSE");
    });
    return ()=> { s.close(); };
  }, [id, me]);

  const runCode = async () => {
    try {
      const langId = languageMap[language];
      // RUN: execute code and show stdout vs expected
      const res = await axios.post(`${API_URL}/run`, { code, language_id: langId }, { headers:{ "Content-Type":"application/json" } });
      const stdout = String((res.data?.output ?? "")).trim();
      const expected = String(problem.expectedOutput ?? "");
      const match = stdout === expected;
      setOutput(`Program output: ${stdout || "<empty>"}\nExpected: ${expected}\nMatch: ${match ? "✅ yes" : "❌ no"}`);
      // Auto-run terminal using current n
      await runTerminal();
    } catch (e) {
      const msg = e?.response?.data?.output || e?.response?.data?.message || e?.message || "⚠ Server Execution Error";
      setOutput(String(msg));
    }
  };

  // Run terminal: invoke solve(n) and print value
  const runTerminal = async () => {
    try{
      setTermBusy(true);
      setTermOut("");
      const n = Number(termN);
      const langId = languageMap[language];
      if (language === "javascript"){
        const src = `${code}\ntry { console.log(String(solve(${Number.isFinite(n)?n:0}))); } catch(e){ console.log("__ERROR__"); }`;
        const r = await axios.post(`${API_URL}/run`, { code: src, language_id: langId }, { headers:{"Content-Type":"application/json"} });
        setTermOut(String(r.data?.output ?? "").trim());
        return;
      }
      if (language === "python"){
        const src = `${code}\ntry:\n  print(str(solve(${Number.isFinite(n)?n:0})))\nexcept Exception as e:\n  print('__ERROR__')\n`;
        const r = await axios.post(`${API_URL}/run`, { code: src, language_id: langId }, { headers:{"Content-Type":"application/json"} });
        setTermOut(String(r.data?.output ?? "").trim());
        return;
      }
      setTermOut("Terminal supports JavaScript and Python only for now.");
    } catch(e){
      const msg = e?.response?.data?.output || e?.response?.data?.message || e?.message || "⚠ Server Execution Error";
      setTermOut(String(msg));
    } finally {
      setTermBusy(false);
    }
  };

  return (
    <div className="arena">
      <header className="nav">
        <Link to="/" className="brand"><img src="/mindmash-logo.png" alt="Mindmash" className="logo" /><span className="brand-text">MINDMASH</span></Link>
        <div className="right">
          <div className="stats">
            <div className="pill"><span className="label">ROOM</span><span className="value">#{id?.toUpperCase()}</span></div>
            <div className={`pill ${opponent ? "ok":"warn"}`}><span className="label">OPPONENT</span><span className="value">{opponent?"JOINED":"WAITING..."}</span></div>
            <div className="pill"><span className="label">MODE</span><span className="value">1v1</span></div>
          </div>
          <div className="profile">
            <button className="avatar" onClick={()=>setMenuOpen(v=>!v)}>{(me?.username ? me.username.slice(0,2) : 'MM').toUpperCase()}</button>
            {menuOpen && (
              <div className="menu">
                {me ? (
                  <div style={{padding:"10px 12px", borderBottom:"1px solid #262645", marginBottom:6}}>
                    <div style={{fontWeight:700}}>@{me.username}</div>
                    <div style={{opacity:.85, fontSize:12, marginTop:4}}>Rank {me.rank} • {me.points} pts</div>
                    <div style={{opacity:.7, fontSize:12}}>Rating {me.rating} • W {me.wins} / L {me.losses}</div>
                  </div>
                ) : (
                  <div style={{padding:"10px 12px", borderBottom:"1px solid #262645", marginBottom:6, opacity:.85}}>Not logged in</div>
                )}
                {me ? (
                  <>
                    <button onClick={()=>{ navigate('/home'); setMenuOpen(false); }}>Profile</button>
                    <button onClick={()=>{ localStorage.removeItem('token'); navigate('/login'); }}>Logout</button>
                  </>
                ) : (
                  <button onClick={()=>{ navigate('/login'); setMenuOpen(false); }}>Login</button>
                )}
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
              <button className="btn-run" disabled={submitting} onClick={async()=>{
                setSubmitting(true);
                const started = Date.now();
                try{
                  const langId = languageMap[language];
                  let correct = false; let passed=0; let total=0;
                  // SUBMIT: run full tests when supported; otherwise fall back to stdout compare
                  if ((language === "javascript" || language === "python") && (problem.id === "factorial-n" || problem.id === "factorial-5")){
                    const r = await axios.post(`${API_URL}/runProblem`, { code, language_id: langId, problemId: problem.id }, { headers:{"Content-Type":"application/json"} });
                    if (!r.data?.error){ passed = r.data.passed; total = r.data.total; correct = passed === total; }
                    const lines = (r.data?.results||[]).map(x=>`${x.pass?"✅":"❌"} input=${x.input} expected=${x.expected} got=${x.got}`).join("\n");
                    setOutput(`Tests passed ${passed}/${total}\n${lines}`);
                  } else {
                    const res = await axios.post(`${API_URL}/run`, { code, language_id: langId }, { headers:{"Content-Type":"application/json"} });
                    const out = String((res.data.output||"").trim());
                    const expected = String(problem.expectedOutput||"");
                    correct = out === expected;
                    passed = correct ? 1 : 0; total = 1;
                    setOutput(`Program output: ${out||"<empty>"}\nExpected: ${expected}\nMatch: ${correct?"✅ yes":"❌ no"}`);
                  }

                  const token = localStorage.getItem("token");
                  const durationMs = Date.now() - started;
                  if (correct && token){
                    try{
                      const resp = await axios.post(`${API_URL}/points/submit`, {
                        problemId: problem.id,
                        difficulty: problem.difficulty || "Easy",
                        passed,
                        total,
                        durationMs,
                        firstTry: attempts === 0,
                        win: true,
                      }, { headers:{ "Content-Type":"application/json", Authorization: `Bearer ${token}` } });
                      window.__mm_rankUp = !!resp.data?.rankUp;
                      window.__mm_newRank = resp.data?.rank || null;
                    }catch{}
                  }

                  if (correct){
                    // Compute accuracy (passed/total) and emit round result; no per-problem WIN banner
                    const accuracy = total > 0 ? passed / total : 0;
                    const timeMs = durationMs;
                    if (socket && me?._id){
                      socket.emit("round_result", { roomId: id, userId: me._id, round, accuracy, timeMs });
                    }

                    if (round < TOTAL_ROUNDS){
                      // Load next problem and advance round
                      let next = null;
                      try{
                        const nxt = await axios.get(`${API_URL}/problems/next`, { params:{ current: problem.id } });
                        next = nxt.data;
                      }catch{ next = nextProblemOf(problem.id); }
                      setProblem(next);
                      sessionStorage.setItem("MM_PROBLEM", JSON.stringify(next));
                      setOutput("");
                      setCode("");
                      setAttempts(0);
                      setRound(r=>r+1);
                    } else {
                      // Finished all rounds: wait for server match_over decision
                      setOutput(prev => (prev?prev+"\n":"") + "All 3 rounds submitted. Waiting for opponent...");
                    }
                  } else {
                    setOutput(prev => prev + "\nNot correct. Use Run to debug and try Submit again.");
                    setAttempts(a=>a+1);
                  }
                } finally {
                  setSubmitting(false);
                }
              }}>✔ Submit</button>
            </div>
          </div>

          <div className="card">
            <div className="card-head">Output</div>
            <pre className="console">{output}</pre>
          </div>

          <div className="card">
            <div className="card-head">Terminal (solve(n))</div>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
              <label style={{opacity:.85}}>n</label>
              <input type="number" value={termN} onChange={(e)=>setTermN(e.target.value)}
                style={{background:"#0e0e18",color:"#fff",border:"1px solid #2a2845",padding:"8px 10px",borderRadius:6, width:120}} />
              <span style={{opacity:.6, fontSize:12}}>JS/Python supported • Terminal auto-runs on Run</span>
            </div>
            <pre className="console">{termOut || "Type n and press Run to execute solve(n)"}</pre>
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
        <div className={`banner ${status.startsWith("RANKUP")?"win":(status==="WIN"?"win":"lose")}`}>
          {status.startsWith("RANKUP") ? `⬆ Rank Up! ${status.split(":")[1]}` : (status==="WIN" ? "🏆 YOU WIN!" : "❌ YOU LOSE!")}
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
        .left,.right{padding:14px;min-width:0;}
        .right{display:flex;flex-direction:column;min-height:0;}
        .card{background:var(--panel);padding:14px;border-radius:8px;margin-bottom:14px;border:1px solid #23233a;}
        .btn-run{padding:10px 14px;background:var(--accent);border:none;color:#fff;border-radius:6px;cursor:pointer;font-weight:800;}
        .console{min-height:120px;background:#0a0a12;padding:10px;border-radius:8px;overflow:auto;border:1px solid #202038;}
        .editor-wrap{height:70vh;min-height:420px;background:#0c0c16;border-radius:8px;border:1px solid #1e1e2f;flex:1;width:100%;}
        .banner{position:fixed;inset:0;display:flex;justify-content:center;align-items:center;font-size:64px;font-weight:900;background:rgba(0,0,0,0.55)}
        .banner.win{color:var(--good);} .banner.lose{color:var(--bad);}
        @media(max-width:1024px){ .grid{ grid-template-columns:1fr; } .editor-wrap{ height:65vh; min-height:420px; } }
      `}</style>
    </div>
  );
}
