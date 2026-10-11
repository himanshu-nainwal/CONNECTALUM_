import express from "express";
import {
  createJob,
  getJobs,
  getMyJobs,
  deleteJob,
  applyToJob,
  getMyApplications,
  getSemanticJobMatches,
  getAlumniReferrals,
  updateReferralStatus,
  getReferralLeaderboard,
} from "../controllers/jobController.js";
import authMiddleware, { requireRole } from "../middleware/auth.js";

const jobRouter = express.Router();

jobRouter.get("/", getJobs);
jobRouter.get("/leaderboard", getReferralLeaderboard);
jobRouter.get("/semantic-matches", authMiddleware, getSemanticJobMatches);
jobRouter.get("/my-jobs", authMiddleware, getMyJobs);
jobRouter.get("/my-applications", authMiddleware, getMyApplications);
jobRouter.get("/alumni-referrals", authMiddleware, getAlumniReferrals);

jobRouter.post("/", authMiddleware, requireRole("alumni", "admin", "master_admin"), createJob);
jobRouter.delete("/:id", authMiddleware, deleteJob);

jobRouter.post("/apply", authMiddleware, applyToJob);
jobRouter.patch("/applications/:id/referral", authMiddleware, updateReferralStatus);

export default jobRouter;
