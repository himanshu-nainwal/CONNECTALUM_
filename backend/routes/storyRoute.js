import express from "express";
import {
  getStories,
  getStoryById,
  createStory,
  toggleStoryLike,
  flagStory,
  getFlaggedStories,
  moderateStory,
} from "../controllers/storyController.js";
import authMiddleware, { requireRole } from "../middleware/auth.js";

const storyRouter = express.Router();

storyRouter.get("/", getStories);
storyRouter.get("/moderation", authMiddleware, requireRole("admin", "master_admin"), getFlaggedStories);
storyRouter.get("/:id", getStoryById);

storyRouter.post("/", authMiddleware, createStory);
storyRouter.post("/:id/like", authMiddleware, toggleStoryLike);
storyRouter.post("/:id/flag", authMiddleware, flagStory);
storyRouter.patch("/:id/moderate", authMiddleware, requireRole("admin", "master_admin"), moderateStory);

export default storyRouter;
