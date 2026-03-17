import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

registrationSchema.index({ event_id: 1, student_id: 1 }, { unique: true });

const Registration = mongoose.model("Registration", registrationSchema);
export default Registration;
