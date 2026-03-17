import express from "express";
import { createResource, getResources, toggleLike, deleteResource } from "../controllers/resourceController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();
router.get("/", getResources);
router.post("/create", authMiddleware, createResource);
router.post("/:id/like", authMiddleware, toggleLike);
router.delete("/:id", authMiddleware, deleteResource);

export default router;
