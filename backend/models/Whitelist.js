import mongoose from "mongoose";

const whitelistSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ["student", "alumni", "admin"], default: "student" },
    batch: { type: Number, default: 2026 },
    department: { type: String, default: "Computer Science & Engineering" },
    name: { type: String, default: "" },
    status: { type: String, enum: ["whitelisted", "registered"], default: "whitelisted" },
  },
  { timestamps: true }
);

const Whitelist = mongoose.model("Whitelist", whitelistSchema);
export default Whitelist;
