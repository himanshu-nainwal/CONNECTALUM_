import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ticket_id: {
      type: String,
      default: () => "TKT-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    },
    status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
    reminder_sent_24h: { type: Boolean, default: false },
    reminder_sent_15m: { type: Boolean, default: false },
  },
  { timestamps: true }
);

registrationSchema.index({ event_id: 1, student_id: 1 }, { unique: true });

const Registration = mongoose.model("Registration", registrationSchema);
export default Registration;
