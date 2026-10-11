import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    department: { type: String, default: "" },
    location: { type: String, default: "Auditorium / Google Meet" },
    updated_on: { type: String, default: "" },
    event_date: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    tags: { type: [String], default: [] },
    price: { type: Number, default: 0 },
    registration_days_left: { type: Number, default: 14 },
    description: { type: String, default: "" },
    speakers: { type: [String], default: [] },
    meeting_link: { type: String, default: "" },
    allowed_batches: { type: [Number], default: [] }, // e.g. [2026, 2027], empty means all
    allowed_departments: { type: [String], default: [] }, // e.g. ["CSE", "ECE"], empty means all
    recording_url: { type: String, default: "" },
    slides_url: { type: String, default: "" },
    posted_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);
export default Event;
