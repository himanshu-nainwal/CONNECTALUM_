import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: "" },
  type:        { type: String, enum: ["notes", "pdf", "link", "video", "other"], default: "notes" },
  content:     { type: String, default: "" },  // text content or URL
  tags:        { type: [String], default: [] },
  subject:     { type: String, default: "" },
  posted_by:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  likes:       { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
  downloads:   { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Resource", resourceSchema);
