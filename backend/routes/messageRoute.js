import express from "express";
import { sendMessage, getConversation, getInbox } from "../controllers/messageController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();
router.post("/send", authMiddleware, sendMessage);
router.get("/inbox", authMiddleware, getInbox);
router.get("/conversation/:userId", authMiddleware, getConversation);

export default router;
