import axios from "axios";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Editor from "@monaco-editor/react";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL;
const socket = io(SOCKET_URL);

const languageMap = {
    javascript: 63,
    python: 71,
    cpp: 54,
    c: 50,
    java: 62,
};

export default function Room() {
    const { id } = useParams();
    const [language, setLanguage] = useState("javascript");
    const [output, setOutput] = useState("Run code to see result...");
    const [status, setStatus] = useState("");
    const [opponent, setOpponent] = useState(false);
    const [time, setTime] = useState(60);

    const templates = {
        javascript: `function factorial(n){
  if(n === 0) return 1;
  return n * factorial(n - 1);
}
console.log(factorial(5));`,
        python: `def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)

print(factorial(5))`,
        cpp: `#include <bits/stdc++.h>
using namespace std;
long long factorial(long long n){
    if(n==0) return 1;
    return n*factorial(n-1);
}
int main(){ cout<<factorial(5); }`,
        c: `#include <stdio.h>
long long factorial(long long n){
    if(n==0) return 1;
    return n*factorial(n-1);
}
int main(){ printf("%lld", factorial(5)); return 0; }`,
        java: `class Main{
    static long factorial(long n){
        if(n==0) return 1;
        return n*factorial(n-1);
    }
    public static void main(String[] args){
        System.out.println(factorial(5));
    }
}`
    };

    const [code, setCode] = useState(templates.javascript);

    useEffect(() => {
        setCode(templates[language]);
        setOutput("Run code to see result...");
    }, [language]);

    useEffect(() => {
        socket.emit("join_room", id);
        socket.on("player_joined", () => setOpponent(true));
        socket.on("opponent_won", () => setStatus("LOSE"));
        socket.on("winner_confirmed", () => setStatus("WIN"));
        return () => {
            socket.off("player_joined");
            socket.off("opponent_won");
            socket.off("winner_confirmed");
        };
    }, [id]);

    useEffect(() => {
        if (status) return;
        const t = setInterval(() => setTime((t) => (t > 0 ? t - 1 : 0)), 1000);
        return () => clearInterval(t);
    }, [status]);

    useEffect(() => {
        if (time === 0 && !status) setStatus("LOSE");
    }, [time]);

    const runCode = async () => {
        try {
            const res = await axios.post(`${API_URL}/run`,
                { code, language_id: languageMap[language] },
                { headers: { "Content-Type": "application/json" } }
            );
            const result = (res.data.output || "").trim();
            setOutput(result || "No Output");
            if (result === "120") socket.emit("win_attempt", { roomId: id });
        } catch {
            setOutput("⚠ Server Execution Error");
        }
    };

    return (
        <div className="arena">

            <div className={`timer ${time <= 10 ? "danger" : ""}`}>⏱ {time}s</div>

            <header className="nav">
                <div className="brand">
                    <span className="dot" /> MINDMASH
                </div>
                <div className="stats">
                    <div className="pill"><span className="label">ROOM</span><span className="value">#{id?.toUpperCase()}</span></div>
                    <div className={`pill ${opponent ? "ok" : "warn"}`}><span className="label">OPPONENT</span><span className="value">{opponent ? "JOINED" : "WAITING..."}</span></div>
                    <div className="pill"><span className="label">MODE</span><span className="value">1v1</span></div>
                </div>
            </header>

            <main className="grid">
                <section className="left">
                    <div className="card">
                        <h2>⚔ Tournament Problem</h2>
                        <p><b>Task:</b> Return <code>factorial(5)</code>.</p>
                        <div className="lang">
                            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
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
                        <Editor height="100%" theme="vs-dark" language={language} value={code}
                            onChange={(v) => setCode(v ?? "")} options={{ minimap: { enabled: false } }} />
                    </div>
                </section>
            </main>

            {status && (
                <div className={`banner ${status === "WIN" ? "win" : "lose"}`}>
                    {status === "WIN" ? "🏆 YOU WIN!" : "❌ YOU LOSE!"}
                </div>
            )}

            <style>{`
        :root{
          --bg:#0b0b12;
          --panel:#0f0f1a;
          --ink:#ecebf6;
          --muted:#9da0b8;
          --accent:#7f5eff;
          --good:#58ff9b;
          --bad:#ff6b6b;
        }
        *{margin:0;padding:0;box-sizing:border-box;}
        body,html,#root,.arena{height:100%;background:var(--bg);color:var(--ink);font-family:Inter, sans-serif;}
        .nav{display:flex;justify-content:space-between;padding:14px 22px;border-bottom:1px solid #1c1c2b;}
        .brand{font-weight:700;display:flex;align-items:center;gap:8px;}
        .dot{width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 10px var(--accent);}
        .stats{display:flex;gap:10px;}
        .pill{background:#11101a;padding:6px 10px;border-radius:6px;font-size:12px;}
        .pill.ok .value{color:var(--good);}
        .pill.warn .value{color:#ffe27a;}
        .grid{display:grid;grid-template-columns:40% 60%;height:calc(100% - 55px);}
        .left,.right{padding:14px;}
        .card{background:var(--panel);padding:14px;border-radius:8px;margin-bottom:14px;}
        .console{min-height:120px;background:#0a0a12;padding:10px;border-radius:8px;overflow:auto;}
        .editor-wrap{height:100%;background:#0c0c16;border-radius:8px;}
        .btn-run{background:var(--accent);border:none;padding:8px 16px;color:white;font-weight:700;border-radius:6px;cursor:pointer;}
        .timer{position:fixed;top:12px;left:50%;transform:translateX(-50%);background:#111;border-radius:8px;padding:6px 16px;border:1px solid #333;}
        .timer.danger{color:var(--bad);text-shadow:0 0 10px var(--bad);}
        .banner{position:fixed;top:0;left:0;right:0;bottom:0;display:flex;justify-content:center;align-items:center;font-size:64px;font-weight:900;background:rgba(0,0,0,0.55);}
        .banner.win{color:var(--good);}
        .banner.lose{color:var(--bad);}
      `}</style>
        </div>
    );
}
