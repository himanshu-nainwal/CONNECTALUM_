import mongoose from "mongoose";

const mentorSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    profile_link: { type: String, default: "" },
    communication: { type: [String], default: [] },
    organization: { type: String, default: "" },
    location: { type: String, default: "" },
    experience: { type: Number, default: 0 },
    expertise: { type: String, default: "" },
    domain_expertise: { type: [String], default: [] },
    pricing_type: { type: String, enum: ["Free", "Paid"], default: "Free" },
    session_fee: { type: Number, default: 0 }, // in INR
    availability_slots: {
      type: [
        {
          id: { type: String },
          day: { type: String }, // e.g. "Monday"
          time: { type: String }, // e.g. "06:00 PM - 07:00 PM"
          is_booked: { type: Boolean, default: false },
        },
      ],
      default: [
        { id: "slot-1", day: "Saturday", time: "05:00 PM - 06:00 PM", is_booked: false },
        { id: "slot-2", day: "Sunday", time: "11:00 AM - 12:00 PM", is_booked: false },
      ],
    },
    rating_average: { type: Number, default: 5.0 },
    rating_count: { type: Number, default: 1 },
    reviews: [
      {
        student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        student_name: { type: String, default: "Anonymous Student" },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    linkedin: { type: String, default: "" },
    instagram: { type: String, default: "" },
    twitter: { type: String, default: "" },
  },
  { timestamps: true }
);

const Mentor = mongoose.model("Mentor", mentorSchema);
export default Mentor;
