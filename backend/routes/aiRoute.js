import express from "express";
import multer from "multer";
import {
  analyzeResume,
  startMockInterview,
  nextInterviewQuestion,
  evaluateInterview,
  chatCareerAdvisor,
} from "../controllers/aiController.js";
import authMiddleware from "../middleware/auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const aiRouter = express.Router();

// Resume Diagnostic (allows optional auth so user can save resume to profile)
aiRouter.post(
  "/resume-analyzer",
  (req, res, next) => {
    // Optional auth middleware
    if (req.headers.authorization) {
      return authMiddleware(req, res, next);
    }
    next();
  },
  upload.single("resume"),
  analyzeResume
);

// Mock Interview
aiRouter.post("/mock-interview/start", startMockInterview);
aiRouter.post("/mock-interview/next", nextInterviewQuestion);
aiRouter.post("/mock-interview/scorecard", evaluateInterview);

// Career Guidance Chatbot
aiRouter.post(
  "/career-chat",
  (req, res, next) => {
    if (req.headers.authorization) {
      return authMiddleware(req, res, next);
    }
    next();
  },
  chatCareerAdvisor
);

export default aiRouter;
