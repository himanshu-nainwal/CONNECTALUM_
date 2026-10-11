import express from "express";
import {
  addMentor,
  getAllMentors,
  bookMentorSlot,
  verifyMentorshipPayment,
  getMyBookings,
  addMentorReview,
} from "../controllers/mentorController.js";
import authMiddleware, { requireRole } from "../middleware/auth.js";

const mentorRouter = express.Router();

mentorRouter.get("/", getAllMentors);
mentorRouter.get("/my-bookings", authMiddleware, getMyBookings);
mentorRouter.post("/", authMiddleware, requireRole("alumni", "admin", "master_admin"), addMentor);
mentorRouter.post("/book", authMiddleware, bookMentorSlot);
mentorRouter.post("/payment/verify", authMiddleware, verifyMentorshipPayment);
mentorRouter.post("/:id/reviews", authMiddleware, addMentorReview);

export default mentorRouter;
