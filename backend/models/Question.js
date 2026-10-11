import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    is_verified_alumni: { type: Boolean, default: false },
    is_accepted: { type: Boolean, default: false },
    upvotes: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
  },
  { timestamps: true }
);

const questionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    tags: { type: [String], default: [] },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ai_draft_answer: { type: String, default: "" },
    answers: { type: [answerSchema], default: [] },
    upvotes: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
    views: { type: Number, default: 0 },
    is_solved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Question", questionSchema);
