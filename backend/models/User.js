import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "alumni"], required: true },
  college: { type: String, default: "" },
  grad_year: { type: Number, default: null },
  department: { type: String, default: "" },
  skills: { type: [String], default: [] },
  job_role: { type: String, default: "" },
  company: { type: String, default: "" },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;
