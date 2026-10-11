import express from "express";
import {
  getQuestions,
  getQuestionById,
  createQuestion,
  addAnswer,
  markAcceptedAnswer,
  toggleQuestionUpvote,
} from "../controllers/qnaController.js";
import authMiddleware from "../middleware/auth.js";

const qnaRouter = express.Router();

qnaRouter.get("/", getQuestions);
qnaRouter.get("/:id", getQuestionById);
qnaRouter.post("/", authMiddleware, createQuestion);
qnaRouter.post("/:id/answers", authMiddleware, addAnswer);
qnaRouter.patch("/:id/answers/:answerId/accept", authMiddleware, markAcceptedAnswer);
qnaRouter.post("/:id/upvote", authMiddleware, toggleQuestionUpvote);

export default qnaRouter;
