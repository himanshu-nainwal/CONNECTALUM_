import express from "express";
import { getEvents, getEventById, createEvent, registerForEvent } from "../controllers/eventController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get("/", getEvents);
router.post("/create", authMiddleware, createEvent);
router.post("/register", authMiddleware, registerForEvent);
router.get("/:id", getEventById);

export default router;
