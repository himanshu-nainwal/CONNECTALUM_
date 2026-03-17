import express from "express";
import { createCommunity, getCommunities, toggleMembership, addPost, getCommunityById, likePost } from "../controllers/communityController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();
router.get("/", getCommunities);
router.post("/create", authMiddleware, createCommunity);
router.get("/:id", authMiddleware, getCommunityById);
router.post("/:id/join", authMiddleware, toggleMembership);
router.post("/:id/post", authMiddleware, addPost);
router.post("/:id/posts/:postId/like", authMiddleware, likePost);

export default router;
