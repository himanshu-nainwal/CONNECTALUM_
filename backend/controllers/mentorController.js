import Mentor from "../models/Mentor.js";
import MentorshipBooking from "../models/MentorshipBooking.js";
import User from "../models/User.js";
import { createRazorpayOrder, verifyRazorpayPayment } from "../services/razorpayService.js";

// -------------------------------------------------------------
// Add / Register as Mentor (Alumni only)
// -------------------------------------------------------------
export const addMentor = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      profileLink,
      communication,
      organization,
      location,
      experience,
      expertise,
      domain_expertise,
      pricing_type,
      session_fee,
      availability_slots,
      linkedin,
      instagram,
      twitter,
    } = req.body;
    const user_id = req.userId;

    if (!firstName || !lastName)
      return res.status(400).json({ error: "First and last name required" });

    // Check if mentor profile already exists for this user
    let mentor = await Mentor.findOne({ user_id });
    if (mentor) {
      mentor.first_name = firstName;
      mentor.last_name = lastName;
      mentor.organization = organization || mentor.organization;
      mentor.location = location || mentor.location;
      mentor.experience = parseInt(experience) || mentor.experience;
      mentor.expertise = expertise || mentor.expertise;
      mentor.domain_expertise = Array.isArray(domain_expertise)
        ? domain_expertise
        : (domain_expertise || "").split(",").map((d) => d.trim()).filter(Boolean);
      mentor.pricing_type = pricing_type || mentor.pricing_type;
      mentor.session_fee = pricing_type === "Paid" ? parseFloat(session_fee) || 499 : 0;
      if (availability_slots) mentor.availability_slots = availability_slots;
      mentor.linkedin = linkedin || mentor.linkedin;
      await mentor.save();
      return res.json({ success: true, mentor: { ...mentor.toObject(), id: mentor._id } });
    }

    mentor = await Mentor.create({
      first_name: firstName,
      last_name: lastName,
      user_id,
      profile_link: profileLink || "",
      communication: Array.isArray(communication) ? communication : [communication].filter(Boolean),
      organization,
      location,
      experience: parseInt(experience) || 0,
      expertise,
      domain_expertise: Array.isArray(domain_expertise)
        ? domain_expertise
        : (domain_expertise || "").split(",").map((d) => d.trim()).filter(Boolean),
      pricing_type: pricing_type || "Free",
      session_fee: pricing_type === "Paid" ? parseFloat(session_fee) || 499 : 0,
      availability_slots: availability_slots || [
        { id: "slot-1", day: "Saturday", time: "05:00 PM - 06:00 PM", is_booked: false },
        { id: "slot-2", day: "Sunday", time: "11:00 AM - 12:00 PM", is_booked: false },
      ],
      linkedin,
      instagram,
      twitter,
    });

    res.status(201).json({ success: true, mentor: { ...mentor.toObject(), id: mentor._id } });
  } catch (err) {
    console.error("Add Mentor Error:", err);
    res.status(500).json({ error: "Failed to save mentor profile" });
  }
};

// -------------------------------------------------------------
// Get All Mentors with Filters
// -------------------------------------------------------------
export const getAllMentors = async (req, res) => {
  const { expertise, search, pricing } = req.query;
  try {
    const query = {};
    if (expertise) query.expertise = { $regex: expertise, $options: "i" };
    if (pricing && pricing !== "all") query.pricing_type = pricing;
    if (search) {
      query.$or = [
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
        { organization: { $regex: search, $options: "i" } },
        { expertise: { $regex: search, $options: "i" } },
        { domain_expertise: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const mentors = await Mentor.find(query).sort({ rating_average: -1, createdAt: -1 });
    res.json(mentors.map((m) => ({ ...m.toObject(), id: m._id })));
  } catch (err) {
    console.error("Get Mentors Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// -------------------------------------------------------------
// Book Mentorship Slot (Module 10)
// -------------------------------------------------------------
export const bookMentorSlot = async (req, res) => {
  const { mentorId, slotId, topic, notes } = req.body;
  const studentId = req.userId;

  try {
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) return res.status(404).json({ success: false, message: "Mentor not found" });

    const slot = mentor.availability_slots.find((s) => s.id === slotId);
    if (!slot) return res.status(404).json({ success: false, message: "Selected slot not found" });
    if (slot.is_booked) return res.status(400).json({ success: false, message: "Slot has already been reserved" });

    const isPaid = mentor.pricing_type === "Paid" && mentor.session_fee > 0;

    let razorpayOrder = null;
    if (isPaid) {
      razorpayOrder = await createRazorpayOrder(mentor.session_fee, "rcpt_" + Date.now().toString());
    }

    const booking = await MentorshipBooking.create({
      mentor_id: mentor._id,
      student_id: studentId,
      slot_id: slot.id,
      slot_day: slot.day,
      slot_time: slot.time,
      topic: topic || "Career Strategy & Technical Roadmap",
      pricing_type: mentor.pricing_type,
      amount: mentor.session_fee,
      payment_status: isPaid ? "pending" : "free",
      razorpay_order_id: razorpayOrder?.id || "",
      student_notes: notes || "",
      status: "confirmed",
    });

    // Mark slot booked
    slot.is_booked = true;
    await mentor.save();

    res.status(201).json({
      success: true,
      booking,
      razorpayOrder,
      isPaid,
      message: isPaid ? "Order initialized. Complete payment." : "1-on-1 Mentorship session confirmed!",
    });
  } catch (err) {
    console.error("Book slot error:", err);
    res.status(500).json({ success: false, message: "Failed to book mentorship session" });
  }
};

// -------------------------------------------------------------
// Verify Razorpay Payment (Module 10)
// -------------------------------------------------------------
export const verifyMentorshipPayment = async (req, res) => {
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    const isValid = verifyRazorpayPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    const booking = await MentorshipBooking.findByIdAndUpdate(
      bookingId,
      {
        payment_status: "paid",
        razorpay_payment_id,
        status: "confirmed",
      },
      { new: true }
    );

    res.json({ success: true, message: "Payment verified successfully", booking });
  } catch (err) {
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};

// -------------------------------------------------------------
// Get My Bookings (Student / Mentor)
// -------------------------------------------------------------
export const getMyBookings = async (req, res) => {
  try {
    const studentBookings = await MentorshipBooking.find({ student_id: req.userId })
      .populate("mentor_id")
      .sort({ createdAt: -1 });

    const mentorProfile = await Mentor.findOne({ user_id: req.userId });
    let mentorBookings = [];
    if (mentorProfile) {
      mentorBookings = await MentorshipBooking.find({ mentor_id: mentorProfile._id })
        .populate("student_id", "name email department batch")
        .sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      asStudent: studentBookings,
      asMentor: mentorBookings,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch bookings" });
  }
};

// -------------------------------------------------------------
// Post-Session 1-5 Rating & Review
// -------------------------------------------------------------
export const addMentorReview = async (req, res) => {
  const { id } = req.params; // mentorId
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: "Rating between 1 and 5 required" });
  }

  try {
    const mentor = await Mentor.findById(id);
    if (!mentor) return res.status(404).json({ success: false, message: "Mentor not found" });

    const student = await User.findById(req.userId).select("name");

    mentor.reviews.push({
      student_id: req.userId,
      student_name: student?.name || "Student Scholar",
      rating: parseInt(rating),
      comment: comment || "Great session!",
      createdAt: new Date(),
    });

    // Recompute average
    const total = mentor.reviews.reduce((sum, r) => sum + r.rating, 0);
    mentor.rating_count = mentor.reviews.length;
    mentor.rating_average = parseFloat((total / mentor.reviews.length).toFixed(1));

    await mentor.save();

    res.json({ success: true, message: "Review posted successfully", mentor });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to submit review" });
  }
};
