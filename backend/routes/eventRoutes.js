import express from "express";
import {
  getEvents,
  getEventById,
  createEvent,
  registerForEvent,
  getMyTickets,
  getEventCalendarIcs,
  sendEventReminders,
} from "../controllers/eventController.js";
import authMiddleware, { requireRole } from "../middleware/auth.js";

const eventRouter = express.Router();

eventRouter.get("/", getEvents);
eventRouter.get("/my-tickets", authMiddleware, getMyTickets);
eventRouter.get("/:id", getEventById);
eventRouter.get("/:id/calendar.ics", getEventCalendarIcs);

eventRouter.post("/", authMiddleware, requireRole("alumni", "admin", "master_admin"), createEvent);
eventRouter.post("/register", authMiddleware, registerForEvent);
eventRouter.post("/:id/remind", authMiddleware, requireRole("alumni", "admin", "master_admin"), sendEventReminders);

export default eventRouter;
