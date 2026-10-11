import express from "express";
import {
  createResource,
  getResources,
  toggleLike,
  toggleBookmark,
  incrementDownload,
  flagResource,
  deleteResource,
} from "../controllers/resourceController.js";
import authMiddleware from "../middleware/auth.js";

const resourceRouter = express.Router();

resourceRouter.get("/", getResources);
resourceRouter.post("/", authMiddleware, createResource);
resourceRouter.post("/:id/like", authMiddleware, toggleLike);
resourceRouter.post("/:id/bookmark", authMiddleware, toggleBookmark);
resourceRouter.post("/:id/download", incrementDownload);
resourceRouter.post("/:id/flag", authMiddleware, flagResource);
resourceRouter.delete("/:id", authMiddleware, deleteResource);

export default resourceRouter;
