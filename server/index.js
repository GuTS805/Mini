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
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json());
app.get("/", (req, res) => {
  res.json({ ok: true, service: "Mindmash API", time: new Date().toISOString() });
});

// DB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log(" MongoDB Connected"))
  .catch(err => console.error(" MongoDB Error:", err));

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

// --- Simple problem pool (can move to Mongo later)
const PROBLEMS = [
  {
    id: "factorial-5",
    title: "Factorial of 5",
    difficulty: "Easy",
    description: "Write a function that returns factorial(5).",
    expectedOutput: "120",
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

      if (s1) io.to(p1.socketId).emit("match_found", { roomId, problem: { id: "factorial-5", title: "Factorial of 5", description: "Return factorial(5).", expectedOutput: "120" } });
      if (s2) io.to(p2.socketId).emit("match_found", { roomId, problem: { id: "factorial-5", title: "Factorial of 5", description: "Return factorial(5).", expectedOutput: "120" } });
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

  socket.on("win_attempt", ({ roomId }) => {
    socket.to(roomId).emit("opponent_won");
    socket.emit("winner_confirmed");
  });

  socket.on("disconnect", () => {
    if (waiting?.socketId === socket.id) waiting = null;
    console.log(" disconnect", socket.id);
  });
});

// Judge0 Runner (raw)
app.post("/run", async (req, res) => {
  const { code, language_id } = req.body;
  try {
    const r = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
      { source_code: code, language_id },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      }
    );
    return res.json({ output: r.data.stdout || r.data.stderr || "No Output" });
  } catch (e) {
    const details = e.response?.data || e.message || "Unknown error";
    console.log("JUDGE0 ERR:", details);
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
  const pid = problemId || 'factorial-5';
  if (pid !== 'factorial-5') return res.status(400).json({ error: 'Unknown problem' });

  const source = buildSource(language_id, code, FACT_TESTS.inputs);
  if (!source) return res.status(400).json({ error: 'Tests currently supported for JavaScript and Python only' });

  try {
    const r = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
      { source_code: source, language_id },
      { headers: { "Content-Type": "application/json", "X-RapidAPI-Key": process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY, "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com" } }
    );

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
    console.log('JUDGE0 TEST ERR:', details);
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
  const token = jwt.sign({ id:user._id, username:user.username }, JWT_SECRET, { expiresIn:"7d" });
  res.json({ token, user: { username:user.username, rating:user.rating, wins:user.wins, losses:user.losses } });
});

app.post("/auth/login", async (req,res)=>{
  const { email,password } = req.body;
  const user = await User.findOne({email});
  if(!user) return res.status(404).json({error:"User not found"});
  const ok = await bcrypt.compare(password, user.password);
  if(!ok) return res.status(401).json({error:"Wrong password"});
  const token = jwt.sign({ id:user._id, username:user.username }, JWT_SECRET, { expiresIn:"7d" });
  res.json({ token, user: { username:user.username, rating:user.rating, wins:user.wins, losses:user.losses } });
});

// ✅ Profile / Leaderboard
app.get("/profile", auth, async (req,res)=>{
  const me = await User.findById(req.user.id).select("-password");
  res.json(me);
});

app.get("/leaderboard", async (req,res)=>{
  const top = await User.find().sort({ rating:-1, wins:-1 }).limit(20)
    .select("username rating wins losses");
  res.json(top);
});

// ✅ Win update (simple)
app.post("/match/win", auth, async (req,res)=>{
  const me = await User.findById(req.user.id);
  me.wins += 1; me.rating += 15;
  await me.save();
  res.json({ rating: me.rating, wins: me.wins });
});

const PORT = process.env.PORT || 5000;
// Serve React build (after APIs)
app.use(express.static(path.join(__dirname, "../client/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

httpServer.listen(PORT, ()=>console.log(`✅ Backend on http://localhost:${PORT}`));
