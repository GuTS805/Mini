import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rating: { type: Number, default: 1200 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    // Points system
    points: { type: Number, default: 0 },
    rank: { type: String, default: "Bronze" },
    streak: { type: Number, default: 0 },
    lastAwardAt: { type: Date },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
