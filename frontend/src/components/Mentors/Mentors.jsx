import { useEffect, useState, useContext } from "react";
import config from "../../config";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import {
  Search,
  Building2,
  Briefcase,
  GraduationCap,
  Filter,
  UserCheck,
  UserPlus,
  Clock,
  MessageCircle,
  Calendar,
  CreditCard,
  Star,
  CheckCircle,
  X,
  Award,
} from "lucide-react";
import toast from "react-hot-toast";
import "./Mentors.css";

const Mentors = ({ onOpenMessages }) => {
  const { user, token, setShowLogin, axiosAuth } = useContext(StoreContext);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pricingFilter, setPricingFilter] = useState("all");

  // Booking Modal
  const [bookingMentor, setBookingMentor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingTopic, setBookingTopic] = useState("Career Strategy & Technical Roadmap");
  const [bookingNotes, setBookingNotes] = useState("");
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Review Modal
  const [reviewMentor, setReviewMentor] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${config.API_URL}/mentors`, {
        params: { search, pricing: pricingFilter },
      });
      setMentors(res.data);
    } catch {
      toast.error("Failed to load mentors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, [search, pricingFilter]);

  // Handle Slot Booking with Razorpay Integration (Module 10)
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!token) {
      setShowLogin(true);
      return;
    }
    if (!selectedSlot) {
      toast.error("Please pick an available calendar slot");
      return;
    }

    try {
      setSubmittingBooking(true);
      const res = await axiosAuth().post("/mentors/book", {
        mentorId: bookingMentor._id,
        slotId: selectedSlot.id,
        topic: bookingTopic,
        notes: bookingNotes,
      });

      if (res.data.success) {
        if (res.data.isPaid && res.data.razorpayOrder) {
          // Razorpay payment flow simulation / checkout
          toast.success("Initializing Razorpay checkout for ₹" + res.data.booking.amount);

          // Simulated signature verification for development test
          setTimeout(async () => {
            const verifyRes = await axiosAuth().post("/mentors/payment/verify", {
              bookingId: res.data.booking._id,
              razorpay_order_id: res.data.razorpayOrder.id,
              razorpay_payment_id: "pay_" + Math.random().toString(36).substring(2, 10),
              razorpay_signature: "mock_signature_valid",
            });
            if (verifyRes.data.success) {
              toast.success("Payment confirmed! 1-on-1 mentorship session booked.");
              setBookingMentor(null);
              fetchMentors();
            }
          }, 800);
        } else {
          toast.success("1-on-1 Mentorship session confirmed! Meeting link generated.");
          setBookingMentor(null);
          fetchMentors();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Submit 1-5 Rating & Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await axiosAuth().post(`/mentors/${reviewMentor._id}/reviews`, {
        rating,
        comment: reviewComment,
      });
      if (res.data.success) {
        toast.success("Thank you! Review and rating posted.");
        setReviewMentor(null);
        setReviewComment("");
        fetchMentors();
      }
    } catch {
      toast.error("Failed to post review");
    }
  };

  return (
    <div className="mentors-wrapper">
      <div className="mentors-hero-bar">
        <div>
          <h2>1-on-1 Alumni Mentorship Marketplace</h2>
          <p>Book verified alumni for code reviews, interview prep, and career strategy with Razorpay integration.</p>
        </div>
      </div>

      <div className="mentors-controls">
        <div className="search-bar">
          <Search size={16} />
          <input
            placeholder="Search by expertise, domain, company (e.g., MERN, System Design, Google)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="pricing-filters">
          <button
            className={`btn btn-sm ${pricingFilter === "all" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setPricingFilter("all")}
          >
            All Sessions
          </button>
          <button
            className={`btn btn-sm ${pricingFilter === "Free" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setPricingFilter("Free")}
          >
            Free Mentorship
          </button>
          <button
            className={`btn btn-sm ${pricingFilter === "Paid" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setPricingFilter("Paid")}
          >
            Premium (Paid)
          </button>
        </div>
      </div>

      <div className="mentors-grid">
        {mentors.map((mentor) => (
          <div key={mentor._id} className="mentor-card card">
            <div className="mentor-header">
              <div className="mentor-avatar">
                {mentor.first_name?.charAt(0)}
                {mentor.last_name?.charAt(0)}
              </div>
              <div className="mentor-title-block">
                <h3>
                  {mentor.first_name} {mentor.last_name}
                </h3>
                <span className="mentor-org">
                  <Building2 size={13} /> {mentor.organization || "Tech Alum"} · {mentor.location || "Remote"}
                </span>
              </div>
            </div>

            <div className="mentor-meta-row">
              <span className={`pricing-tag ${mentor.pricing_type === "Paid" ? "paid" : "free"}`}>
                {mentor.pricing_type === "Paid" ? `₹${mentor.session_fee || 499} / session` : "Free Session"}
              </span>
              <span className="rating-badge">
                <Star size={13} fill="#f59e0b" color="#f59e0b" /> {mentor.rating_average || 5.0} (
                {mentor.rating_count || 1} reviews)
              </span>
            </div>

            <p className="mentor-expertise">
              <strong>Domain Expertise:</strong> {mentor.expertise || "Full Stack Engineering & Career Guidance"}
            </p>

            {/* Weekly Availability Preview */}
            <div className="availability-preview">
              <Calendar size={13} />
              <span>
                {mentor.availability_slots?.filter((s) => !s.is_booked).length || 0} weekly slots available
              </span>
            </div>

            <div className="mentor-card-actions">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setReviewMentor(mentor);
                }}
              >
                <Star size={13} /> Rate
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setBookingMentor(mentor);
                  setSelectedSlot(mentor.availability_slots?.find((s) => !s.is_booked) || null);
                }}
              >
                <Calendar size={13} /> Book 1-on-1 Slot
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Slot Booking Modal */}
      {bookingMentor && (
        <div className="modal-overlay" onClick={() => setBookingMentor(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <div>
                <h2>
                  Book Session with {bookingMentor.first_name} {bookingMentor.last_name}
                </h2>
                <span className="sub-text">
                  Pricing: {bookingMentor.pricing_type === "Paid" ? `₹${bookingMentor.session_fee}` : "Free"}
                </span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setBookingMentor(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking}>
              <div className="form-group" style={{ marginTop: "16px" }}>
                <label>Select an Available Weekly Calendar Slot:</label>
                <div className="slots-picker-grid">
                  {bookingMentor.availability_slots?.map((slot, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`slot-pill ${selectedSlot?.id === slot.id ? "selected" : ""} ${
                        slot.is_booked ? "booked" : ""
                      }`}
                      disabled={slot.is_booked}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <span>{slot.day}</span>
                      <strong>{slot.time}</strong>
                      {slot.is_booked && <span className="booked-text">Reserved</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Session Focus / Topic</label>
                <input
                  type="text"
                  className="input"
                  value={bookingTopic}
                  onChange={(e) => setBookingTopic(e.target.value)}
                  placeholder="e.g. Resume ATS feedback & DSA coding strategy"
                  required
                />
              </div>

              <div className="form-group">
                <label>Notes or Questions for Alumnus</label>
                <textarea
                  rows={3}
                  className="input"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Share details about what you want to achieve during the call..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setBookingMentor(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingBooking || !selectedSlot}>
                  {submittingBooking
                    ? "Processing Booking..."
                    : bookingMentor.pricing_type === "Paid"
                    ? `Pay ₹${bookingMentor.session_fee} via Razorpay`
                    : "Confirm Free Mentorship Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review & 1-5 Star Modal */}
      {reviewMentor && (
        <div className="modal-overlay" onClick={() => setReviewMentor(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>
              Rate Mentorship with {reviewMentor.first_name} {reviewMentor.last_name}
            </h2>
            <form onSubmit={handleSubmitReview}>
              <div className="rating-select-row">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`star-pick-btn ${rating >= num ? "active" : ""}`}
                    onClick={() => setRating(num)}
                  >
                    <Star size={24} fill={rating >= num ? "#f59e0b" : "none"} color="#f59e0b" />
                  </button>
                ))}
              </div>
              <div className="form-group">
                <label>Student Feedback Review</label>
                <textarea
                  rows={4}
                  className="input"
                  placeholder="How helpful was the mentorship session? Share your feedback for fellow students..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setReviewMentor(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit 1-5 Star Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mentors;
