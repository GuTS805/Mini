import express from "express";
import cors from "cors";
import axios from "axios";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";    // ✅ ADD THIS
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "./models/User.js"; // ✅ FIXED MODEL IMPORT
dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.log("❌ MongoDB Error:", err));

// ✅ JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 5000;

// ✅ Authentication Middleware
const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
};

// ✅ HTTP + Socket Server
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", (socket) => {
    console.log("⚡ User Connected:", socket.id);

    socket.on("join_room", (roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit("player_joined");
    });

    socket.on("win_attempt", ({ roomId }) => {
        socket.to(roomId).emit("opponent_won");
        socket.emit("winner_confirmed");
    });
});

// ✅ Run Code (Judge0)
app.post("/run", async (req, res) => {
    const { code, language_id } = req.body;

    try {
        const r = await axios.post(
            "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
            { source_code: code, language_id },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-RapidAPI-Key": process.env.RAPID_API_KEY,
                    "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
                },
            }
        );

        return res.json({
            output: r.data.stdout || r.data.stderr || "No Output",
        });

    } catch (err) {
        console.log("🔥 JUDGE0 ERROR:", err.response?.data || err.message);
        return res.json({ output: "⚠ Server Execution Error" });
    }
});

// ✅ SIGNUP
app.post("/auth/signup", async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
        return res.status(400).json({ error: "All fields required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
        username,
        email,
        password: hash,
        rating: 1200,
        wins: 0,
        losses: 0,
    });

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user });
});

// ✅ LOGIN
app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Wrong password" });

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user });
});

// ✅ Start Server
httpServer.listen(PORT, () =>
    console.log(`🚀 Server Running at http://localhost:${PORT}`)
);
