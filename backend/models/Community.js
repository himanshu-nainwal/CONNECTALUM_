import mongoose from "mongoose";

const communityPostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text:   { type: String, required: true },
  likes:  { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
}, { timestamps: true });

const communitySchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String, default: "" },
  topic:       { type: String, default: "" },
  created_by:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members:     { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
  posts:       { type: [communityPostSchema], default: [] },
  is_private:  { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Community", communitySchema);
