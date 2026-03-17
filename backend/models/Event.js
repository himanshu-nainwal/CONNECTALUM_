import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  department: { type: String, default: "" },
  location: { type: String, default: "" },
  updated_on: { type: String, default: "" },
  tags: { type: [String], default: [] },
  price: { type: Number, default: 0 },
  registration_days_left: { type: Number, default: 30 },
  description: { type: String, default: "" },
  speakers: { type: [String], default: [] },
  meeting_link: { type: String, default: "" },
  posted_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const Event = mongoose.model("Event", eventSchema);
export default Event;
