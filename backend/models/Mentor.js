import mongoose from "mongoose";

const mentorSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  profile_link: { type: String, default: "" },
  communication: { type: [String], default: [] },
  organization: { type: String, default: "" },
  location: { type: String, default: "" },
  experience: { type: Number, default: 0 },
  expertise: { type: String, default: "" },
  linkedin: { type: String, default: "" },
  instagram: { type: String, default: "" },
  twitter: { type: String, default: "" },
}, { timestamps: true });

const Mentor = mongoose.model("Mentor", mentorSchema);
export default Mentor;
