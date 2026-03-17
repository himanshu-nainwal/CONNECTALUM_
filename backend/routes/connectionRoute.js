import express from "express";
import { sendRequest, respondRequest, getMyConnections, getPendingRequests, getConnectionStatus } from "../controllers/connectionController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();
router.post("/request", authMiddleware, sendRequest);
router.put("/respond", authMiddleware, respondRequest);
router.get("/mine", authMiddleware, getMyConnections);
router.get("/pending", authMiddleware, getPendingRequests);
router.get("/status/:userId", authMiddleware, getConnectionStatus);

export default router;
