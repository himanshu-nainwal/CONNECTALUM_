import express from "express";
import { addMentor, getAllMentors } from "../controllers/mentorController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/add", authMiddleware, addMentor);
router.get("/", getAllMentors);

export default router;
