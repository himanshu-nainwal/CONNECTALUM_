import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "alumni", "admin", "master_admin"],
      default: "student",
      required: true,
    },
    college: { type: String, default: "Graphic Era Hill University" },
    grad_year: { type: Number, default: 2026 },
    batch: { type: Number, default: 2026 },
    department: { type: String, default: "Computer Science & Engineering" },
    skills: { type: [String], default: [] },
    job_role: { type: String, default: "" },
    company: { type: String, default: "" },
    bio: { type: String, default: "" },
    github: { type: String, default: "" },
    leetcode: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    resume_url: { type: String, default: "" },
    resume_text: { type: String, default: "" },
    is_verified: { type: Boolean, default: true },
    is_suspended: { type: Boolean, default: false },
    is_banned: { type: Boolean, default: false },
    has_backlog: { type: Boolean, default: false },
    referrals_granted: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
