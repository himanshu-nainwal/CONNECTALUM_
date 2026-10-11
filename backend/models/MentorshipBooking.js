import mongoose from "mongoose";

const mentorshipBookingSchema = new mongoose.Schema(
  {
    mentor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Mentor", required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    slot_id: { type: String, required: true },
    slot_day: { type: String, required: true },
    slot_time: { type: String, required: true },
    topic: { type: String, default: "Career & Tech Mentorship" },
    pricing_type: { type: String, enum: ["Free", "Paid"], default: "Free" },
    amount: { type: Number, default: 0 },
    payment_status: {
      type: String,
      enum: ["free", "pending", "paid", "failed"],
      default: "free",
    },
    razorpay_order_id: { type: String, default: "" },
    razorpay_payment_id: { type: String, default: "" },
    status: {
      type: String,
      enum: ["confirmed", "completed", "cancelled"],
      default: "confirmed",
    },
    meeting_link: { type: String, default: "https://meet.google.com/connectalum-session" },
    student_notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("MentorshipBooking", mentorshipBookingSchema);
