import mongoose from "mongoose";

const jobApplicationSchema = new mongoose.Schema(
  {
    job_id: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    cover_note: { type: String, default: "" },
    resume_link: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Granted", "Declined", "applied", "reviewed", "accepted", "rejected"],
      default: "Pending",
    },
    alumni_notes: { type: String, default: "" },
    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewed_at: { type: Date },
  },
  { timestamps: true }
);

jobApplicationSchema.index({ job_id: 1, applicant: 1 }, { unique: true });

export default mongoose.model("JobApplication", jobApplicationSchema);
