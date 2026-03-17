import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, enum: ["Full-time", "Part-time", "Internship", "Contract"], required: true },
  description: { type: String, default: "" },
  salary_range: { type: String, default: "" },
  requirements: { type: String, default: "" },
  posted_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

const Job = mongoose.model("Job", jobSchema);
export default Job;
