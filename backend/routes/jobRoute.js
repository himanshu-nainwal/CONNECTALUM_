import express from "express";
import { createJob, getJobs, getMyJobs, deleteJob, applyToJob, getMyApplications, getApplicationsForJob, getApplicationStatus } from "../controllers/jobController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get("/", getJobs);
router.post("/create", authMiddleware, createJob);
router.get("/myjobs", authMiddleware, getMyJobs);
router.delete("/:id", authMiddleware, deleteJob);
router.post("/apply", authMiddleware, applyToJob);
router.get("/my-applications", authMiddleware, getMyApplications);
router.get("/:jobId/applications", authMiddleware, getApplicationsForJob);
router.get("/:jobId/apply-status", authMiddleware, getApplicationStatus);

export default router;
