import express from "express";
import cors from "cors";
import axios from "axios";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "./models/User.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import vm from "vm";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json());
// Health/status endpoint
app.get("/status", (req, res) => {
  res.json({ ok: true, service: "Mindmash API", time: new Date().toISOString() });
});

// DB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(" MongoDB Connected"))
  .catch(err => console.error(" MongoDB Error:", err));

// Inline Problem model (avoid separate file in chat mode)
const Problem = mongoose.models.Problem || mongoose.model("Problem", new mongoose.Schema({
  slug: { type: String, unique: true, required: true },
  title: String,
  description: String,
  expectedOutput: String,
  difficulty: { type: String, enum: ["Easy","Medium","Hard"], default: "Easy" },
}, { timestamps: true }));

async function ensureSeedProblems(){
  const count = await Problem.countDocuments();
  if (count > 0) return;
  await Problem.insertMany([
    { slug: "factorial-n", title: "Factorial of n", description: "Return factorial(n).", expectedOutput: "", difficulty: "Easy" },
    { slug: "reverse-hello", title: "Reverse 'hello'", description: "Print the reverse of the string 'hello'.", expectedOutput: "olleh", difficulty: "Easy" },
    { slug: "fib-10", title: "10th Fibonacci", description: "Print the 10th Fibonacci number (0-indexed: F0=0, F1=1).", expectedOutput: "55", difficulty: "Medium" },
  ]);
  console.log(" Seeded default problems (3)");
}
ensureSeedProblems().catch(console.error);

// JWT helpers
const JWT_SECRET = process.env.JWT_SECRET || "mindmash_secret";
const auth = (req, res, next) => {
  const t = req.headers.authorization?.split(" ")[1];
  if (!t) return res.status(401).json({ error: "No token" });
  try { req.user = jwt.verify(t, JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: "Invalid token" }); }
};

// HTTP + Socket Server
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*", methods: ["GET", "POST"] } });

// --- Simple matchmaking state
let waiting = null; // { socketId, user }
const activeRooms = new Map(); // roomId -> { players: [id1,id2] }
const roomMatches = new Map(); // roomId -> { rounds: { [userId]: { [round]: { accuracy, timeMs } } } }

// --- Simple problem pool (can move to Mongo later)
const PROBLEMS = [
  {
    id: "factorial-n",
    title: "Factorial of n",
    difficulty: "Easy",
    description: "Write a function solve(n) that returns n! (factorial of n).",
    expectedOutput: "",
    languageHints: {
      javascript: `function factorial(n){ if(n===0) return 1; return n*factorial(n-1); }
console.log(factorial(5));`,
      python: `def factorial(n):
    if n==0: return 1
    return n*factorial(n-1)
print(factorial(5))`,
      c: `#include <stdio.h>
long long f(long long n){ return n? n*f(n-1):1; }
int main(){ printf("%lld", f(5)); }`,
      cpp: `#include <bits/stdc++.h>
using namespace std; long long f(long long n){ return n? n*f(n-1):1; }
int main(){ cout<<f(5); }`,
      java: `class Main{ static long f(long n){ return n==0?1:n*f(n-1); }
public static void main(String[] a){ System.out.println(f(5)); }}`
    }
  },
  {
    id: "reverse-hello",
    title: "Reverse 'hello'",
    difficulty: "Easy",
    description: "Print the reverse of the string 'hello'.",
    expectedOutput: "olleh",
  },
  {
    id: "fib-10",
    title: "10th Fibonacci",
    difficulty: "Medium",
    description: "Print the 10th Fibonacci number (0-indexed: F0=0, F1=1).",
    expectedOutput: "55",
  }
];

const pickProblem = () => PROBLEMS[Math.floor(Math.random() * PROBLEMS.length)];

io.on("connection", (socket) => {
  console.log(" User Connected:", socket.id);

  // Optional identify via JWT for UI
  socket.on("identify", (token) => {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.user = { id: payload.id, username: payload.username };
    } catch {
      socket.data.user = null;
    }
  });

  // Direct join (existing behavior)
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("player_joined");
  });

  // Matchmaking queue
  socket.on("queue", () => {
    console.log(" queue from", socket.id);
    if (waiting && waiting.socketId !== socket.id) {
      const roomId = Math.random().toString(36).slice(2, 8).toUpperCase();
      const p1 = waiting;
      const p2 = { socketId: socket.id, user: socket.data.user };
      waiting = null;

      activeRooms.set(roomId, { players: [p1.socketId, p2.socketId] });

      const s1 = io.sockets.sockets.get(p1.socketId);
      const s2 = io.sockets.sockets.get(p2.socketId);
      s1?.join(roomId);
      s2?.join(roomId);

      if (s1) io.to(p1.socketId).emit("match_found", { roomId, problem: { id: "factorial-n", title: "Factorial of n", description: "Return factorial(n).", expectedOutput: "" } });
      if (s2) io.to(p2.socketId).emit("match_found", { roomId, problem: { id: "factorial-n", title: "Factorial of n", description: "Return factorial(n).", expectedOutput: "" } });
      console.log(" match_found ->", roomId, p1.socketId, p2.socketId);
    } else {
      waiting = { socketId: socket.id, user: socket.data.user };
      socket.emit("queued");
      console.log(" queued", socket.id);
    }
  });

  socket.on("cancel_queue", () => {
    if (waiting?.socketId === socket.id) {
      waiting = null;
      socket.emit("queue_canceled");
      console.log(" queue canceled", socket.id);
    }
  });

  // Deprecated single-attempt win signal (kept for backward compat)
  socket.on("win_attempt", ({ roomId }) => {
    socket.to(roomId).emit("opponent_won");
    socket.emit("winner_confirmed");
  });

  // New: per-round result for 3-round match
  socket.on("round_result", ({ roomId, userId, round, accuracy, timeMs }) => {
    if (!roomMatches.has(roomId)) roomMatches.set(roomId, { rounds: {} });
    const data = roomMatches.get(roomId);
    if (!data.rounds[userId]) data.rounds[userId] = {};
    data.rounds[userId][round] = { accuracy, timeMs };

    // Broadcast progress to room
    io.to(roomId).emit("round_progress", { userId, round });

    const users = Object.keys(data.rounds);

    // 1) First-finisher auto-win: if this user has rounds 1..3 and at least one opponent is missing any round, declare immediate win.
    const thisHasAll = !!(data.rounds[userId][1] && data.rounds[userId][2] && data.rounds[userId][3]);
    if (thisHasAll) {
      const others = users.filter(u => u !== userId);
      const anyOpponentMissingAll3 = others.some(u => !(data.rounds[u] && data.rounds[u][1] && data.rounds[u][2] && data.rounds[u][3]));
      // If no opponent recorded yet OR opponent hasn't finished all 3, auto-win
      if (users.length < 2 || anyOpponentMissingAll3) {
        const scoreOf = (uid) => {
          let total = 0;
          for (let r = 1; r <= 3; r++) {
            const { accuracy = 0, timeMs = 0 } = (data.rounds[uid] || {})[r] || {};
            const s = Math.round(100 * accuracy + Math.max(0, 50 - timeMs / 1000));
            total += s;
          }
          return total;
        };
        const payloadUsers = users.map(u => ({ userId: u, score: scoreOf(u), rounds: data.rounds[u] }));
        io.to(roomId).emit("match_over", { users: payloadUsers, winner: userId });
        roomMatches.delete(roomId);
        return;
      }
    }

    // 2) Fallback: if both finished all 3, choose winner by score
    if (users.length >= 2) {
      const haveAll = users.every(uid => data.rounds[uid][1] && data.rounds[uid][2] && data.rounds[uid][3]);
      if (haveAll) {
        const scoreOf = (uid) => {
          let total = 0;
          for (let r = 1; r <= 3; r++) {
            const { accuracy = 0, timeMs = 0 } = data.rounds[uid][r] || {};
            const s = Math.round(100 * accuracy + Math.max(0, 50 - timeMs / 1000));
            total += s;
          }
          return total;
        };
        const [u1, u2] = users;
        const s1 = scoreOf(u1);
        const s2 = scoreOf(u2);
        const winner = s1 === s2 ? null : (s1 > s2 ? u1 : u2);
        io.to(roomId).emit("match_over", {
          users: [
            { userId: u1, score: s1, rounds: data.rounds[u1] },
            { userId: u2, score: s2, rounds: data.rounds[u2] },
          ],
          winner,
        });
        roomMatches.delete(roomId);
      }
    }
  });

  socket.on("disconnect", () => {
    if (waiting?.socketId === socket.id) waiting = null;
    console.log(" disconnect", socket.id);
  });
});

// Local JS fallback using Node VM (for language_id 63)
function runJsLocally(source, timeoutMs = 1500){
  const logs = [];
  const sandbox = {
    console: { log: (...args) => logs.push(args.map(a => String(a)).join(" ")) },
    setTimeout,
    setInterval,
    clearTimeout,
    clearInterval,
  };
  try{
    const script = new vm.Script(source, { timeout: timeoutMs });
    const context = vm.createContext(sandbox);
    script.runInContext(context, { timeout: timeoutMs });
    return { stdout: logs.join("\n"), stderr: "" };
  }catch(e){
    return { stdout: "", stderr: String(e && e.message ? e.message : e) };
  }
}

// Judge0 Runner (raw)
app.post("/run", async (req, res) => {
  const { code, language_id } = req.body;
  // Short-circuit JavaScript to local VM to avoid Judge0 quotas and latency
  if (language_id === 63) {
    const out = runJsLocally(code);
    return res.json({ output: out.stdout || out.stderr || "No Output" });
  }
  const rapidKey = process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY;
  const tryRapid = async () => axios.post(
    "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
    { source_code: code, language_id },
    { headers: { "Content-Type": "application/json", "X-RapidAPI-Key": rapidKey, "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com" } }
  );
  try {
    if (!rapidKey) throw new Error("No RAPIDAPI_KEY configured");
    const r = await tryRapid();
    return res.json({ output: r.data.stdout || r.data.stderr || "No Output" });
  } catch (e) {
    const details = e.response?.data || e.message || "Unknown error";
    const msg = typeof details === "string" ? details : (details?.message || "Error");
    console.log("JUDGE0 ERR:", msg);
    const isQuota = String(msg).toLowerCase().includes("exceeded the daily quota");
    if (isQuota) return res.status(429).json({ error: 'quota', message: msg });
    return res.json({ output: typeof details === "string" ? details : (details?.message || "⚠ Server Execution Error") });
  }
});

// Judge0 Runner with tests: expects a function solve(n)
const FACT_TESTS = { inputs: [0,1,3,5,7], expected: [1,1,6,120,5040] };

function buildSource(language_id, userCode, inputs){
  if (language_id === 63) { // JavaScript (Node.js)
    return `${userCode}\nconst __inputs__ = ${JSON.stringify(inputs)};\nfor (const n of __inputs__) {\n  try { const r = solve(n); console.log(String(r)); } catch(e){ console.log('__ERROR__'); }\n}`;
  }
  if (language_id === 71) { // Python
    return `${userCode}\n__inputs__ = ${JSON.stringify(inputs)}\nfor n in __inputs__:\n  try:\n    print(solve(n))\n  except Exception as e:\n    print('__ERROR__')\n`;
  }
  return null; // unsupported for now
}

app.post("/runProblem", async (req,res)=>{
  const { code, language_id, problemId } = req.body;
  const pid = problemId || 'factorial-n';
  if (!['factorial-n','factorial-5'].includes(pid)) return res.status(400).json({ error: 'Unknown problem' });

  const source = buildSource(language_id, code, FACT_TESTS.inputs);
  if (!source) return res.status(400).json({ error: 'Tests currently supported for JavaScript and Python only' });

  // Short-circuit JavaScript tests locally to avoid Judge0 quotas
  if (language_id === 63) {
    const out = runJsLocally(source);
    const stdout = (out.stdout || '').trim();
    const lines = stdout ? stdout.split(/\r?\n/) : [];
    const results = FACT_TESTS.inputs.map((inp, i)=>{
      const got = lines[i] ?? '';
      const exp = String(FACT_TESTS.expected[i]);
      return { input: inp, expected: exp, got, pass: got === exp };
    });
    const passed = results.filter(x=>x.pass).length;
    return res.json({ passed, total: results.length, results, raw: { stdout, stderr: out.stderr || '' } });
  }

  const rapidKey = process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY;
  const tryRapid = async () => axios.post(
    "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
    { source_code: source, language_id },
    { headers: { "Content-Type": "application/json", "X-RapidAPI-Key": rapidKey, "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com" } }
  );

  try {
    if (!rapidKey) throw new Error("No RAPIDAPI_KEY configured");
    const r = await tryRapid();
    const stdout = (r.data.stdout || '').trim();
    const lines = stdout ? stdout.split(/\r?\n/) : [];
    const results = FACT_TESTS.inputs.map((inp, i)=>{
      const got = lines[i] ?? '';
      const exp = String(FACT_TESTS.expected[i]);
      return { input: inp, expected: exp, got, pass: got === exp };
    });
    const passed = results.filter(x=>x.pass).length;
    return res.json({ passed, total: results.length, results, raw: { stdout, stderr: r.data.stderr || '' } });
  } catch(e){
    const details = e.response?.data || e.message || 'Unknown error';
    const msg = typeof details === 'string' ? details : (details?.message || 'Error');
    console.log('JUDGE0 TEST ERR:', msg);
    // Fallback to local JS execution when possible
    if (language_id === 63) {
      const out = runJsLocally(source);
      const stdout = (out.stdout || '').trim();
      const lines = stdout ? stdout.split(/\r?\n/) : [];
      const results = FACT_TESTS.inputs.map((inp, i)=>{
        const got = lines[i] ?? '';
        const exp = String(FACT_TESTS.expected[i]);
        return { input: inp, expected: exp, got, pass: got === exp };
      });
      const passed = results.filter(x=>x.pass).length;
      return res.json({ passed, total: results.length, results, raw: { stdout, stderr: out.stderr || '' } });
    }
    const isQuota = String(msg).toLowerCase().includes('exceeded the daily quota');
    if (isQuota) return res.status(429).json({ error: 'quota', message: msg });
    return res.status(500).json({ error: typeof details === 'string' ? details : (details?.message || 'Server error') });
  }
});

// ✅ Auth
app.post("/auth/signup", async (req,res)=>{
  const { username,email,password } = req.body;
  if(!username||!email||!password) return res.status(400).json({error:"All fields required"});
  if(await User.findOne({email})) return res.status(409).json({error:"Email already exists"});
  if(await User.findOne({username})) return res.status(409).json({error:"Username taken"});
  const hash = await bcrypt.hash(password,10);
  const user = await User.create({ username,email,password:hash, rating:1200, wins:0, losses:0 });
  const token = jwt.sign({ id:user._id, username:user.username }, JWT_SECRET, { expiresIn:"1d" });
  res.json({ token, user: { username:user.username, rating:user.rating, wins:user.wins, losses:user.losses } });
});

app.post("/auth/login", async (req,res)=>{
  const { email,password } = req.body;
  const user = await User.findOne({email});
  if(!user) return res.status(404).json({error:"User not found"});
  const ok = await bcrypt.compare(password, user.password);
  if(!ok) return res.status(401).json({error:"Wrong password"});
  const token = jwt.sign({ id:user._id, username:user.username }, JWT_SECRET, { expiresIn:"1d" });
  res.json({ token, user: { username:user.username, rating:user.rating, wins:user.wins, losses:user.losses } });
});

// Problems API
app.get("/problems/next", async (req,res)=>{
  try{
    const current = req.query.current;
    const all = await Problem.find().sort({ createdAt: 1 }).lean();
    if (!all.length) return res.status(404).json({ error: "No problems" });
    let idx = Math.max(0, all.findIndex(p=>p.slug===current));
    const next = all[(idx + 1) % all.length];
    return res.json({ id: next.slug, title: next.title, description: next.description, expectedOutput: next.expectedOutput, difficulty: next.difficulty });
  }catch(e){
    console.error("/problems/next error", e);
    return res.status(500).json({ error: "Failed to fetch next problem" });
  }
});

// ✅ Profile / Leaderboard
app.get("/profile", auth, async (req,res)=>{
  const me = await User.findById(req.user.id).select("-password");
  res.json(me);
});

// Lightweight /me alias (for client convenience)
app.get("/me", auth, async (req,res)=>{
  const me = await User.findById(req.user.id).select("-password");
  const next = nextRankAt(me.points || 0);
  res.json({ _id: me._id, id: String(me._id), username: me.username, rating: me.rating, wins: me.wins, losses: me.losses, points: me.points || 0, rank: me.rank || "Bronze", streak: me.streak || 0, nextRankAt: next });
});

app.get("/leaderboard", async (req,res)=>{
  const top = await User.find().sort({ rating:-1, wins:-1 }).limit(20)
    .select("username rating wins losses points rank");
  res.json(top);
});

// ✅ Win update (simple)
app.post("/match/win", auth, async (req,res)=>{
  const me = await User.findById(req.user.id);
  me.wins += 1; me.rating += 15;
  await me.save();
  res.json({ rating: me.rating, wins: me.wins });
});

// ---------- Points System ----------
const RANKS = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 500 },
  { name: "Gold", min: 1200 },
  { name: "Platinum", min: 2200 },
  { name: "Diamond", min: 3500 },
  { name: "Mythic", min: 5200 },
];
function rankFromPoints(points){
  let current = RANKS[0].name;
  for (const r of RANKS) if (points >= r.min) current = r.name; else break;
  return current;
}
function isHigherRank(a, b){
  const ia = RANKS.findIndex(r=>r.name===a);
  const ib = RANKS.findIndex(r=>r.name===b);
  return ia > ib;
}
function nextRankAt(points){
  const next = RANKS.find(r => r.min > points);
  return next ? next.min : null;
}
function baseForDifficulty(diff){
  const d = String(diff || "easy").toLowerCase();
  if (d === "hard") return 200; if (d === "medium") return 100; return 50;
}
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

app.post("/points/submit", auth, async (req,res)=>{
  try {
    const { problemId, difficulty, passed=0, total=0, durationMs=0, firstTry=false, win=false } = req.body || {};
    const me = await User.findById(req.user.id);

    const beforeRank = me.rank || rankFromPoints(me.points || 0);

    // compute
    const base = baseForDifficulty(difficulty);
    const ratio = total > 0 ? (passed/total) : 0;
    let pts = Math.round(base * ratio);

    if (win && ratio === 1) {
      const target = String(difficulty||"easy").toLowerCase()==="hard" ? 15*60_000 : (String(difficulty||"easy").toLowerCase()==="medium" ? 7*60_000 : 3*60_000);
      const timeBonus = clamp(1 - (durationMs/target), 0, 1) * 0.30; // 0..0.3
      const firstTryBonus = firstTry ? 0.20 : 0;
      const streakBonus = clamp((me.streak || 0) * 0.10, 0, 0.30);
      pts = Math.round(pts * (1 + timeBonus + firstTryBonus + streakBonus));
    }

    const now = new Date();
    const sameDay = me.lastAwardAt && (new Date(me.lastAwardAt)).toDateString() === now.toDateString();
    if (!sameDay) me._awardedToday = 0;

    me.points = (me.points || 0) + pts;
    if (win && ratio === 1) me.streak = (me.streak || 0) + 1; else me.streak = 0;
    me.rank = rankFromPoints(me.points || 0);
    me.lastAwardAt = now;
    await me.save();

    const afterRank = me.rank;
    const rankUp = isHigherRank(afterRank, beforeRank);

    return res.json({ delta: pts, points: me.points, rank: me.rank, rankUp, streak: me.streak, nextRankAt: nextRankAt(me.points) });
  } catch (e) {
    console.error("/points/submit error", e);
    return res.status(500).json({ error: "Failed to submit points" });
  }
});

const PORT = process.env.PORT || 5000;
// Serve React build (after APIs). Mount only if build exists to avoid ENOENT on Render
const clientDist = path.resolve(__dirname, "../client/dist");
const clientIndex = path.join(clientDist, "index.html");
if (fs.existsSync(clientIndex)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    res.sendFile(clientIndex);
  });
} else {
  console.warn("[SPA] client/dist not found. Serving API only. Build client or set correct path.");
}

httpServer.listen(PORT, ()=>console.log(`✅ Backend on http://localhost:${PORT}`));
