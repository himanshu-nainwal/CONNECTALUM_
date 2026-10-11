import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import {
  analyzeResumeDiagnostic,
  generateInterviewQuestion,
  evaluateInterviewTranscript,
  generateCareerAdvice,
} from "../services/aiService.js";
import User from "../models/User.js";

// -------------------------------------------------------------
// Module 5: AI Resume Diagnostic Analyzer & ATS Scoring Engine
// -------------------------------------------------------------
export const analyzeResume = async (req, res) => {
  try {
    let resumeText = req.body.resumeText || "";
    const targetRole = req.body.targetRole || "Software Development Engineer";

    // If PDF file was uploaded via multer
    if (req.file && req.file.buffer) {
      try {
        const parsedPdf = await pdf(req.file.buffer);
        resumeText = parsedPdf.text || "";
      } catch (pdfErr) {
        console.warn("PDF parse error, checking body fallback:", pdfErr.message);
      }
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: "Please upload a valid PDF resume or paste at least 50 characters of resume text.",
      });
    }

    const diagnosticReport = await analyzeResumeDiagnostic(resumeText, targetRole);

    // Save extracted text to user profile if user is authenticated
    if (req.userId) {
      await User.findByIdAndUpdate(req.userId, { resume_text: resumeText.slice(0, 5000) });
    }

    res.json({
      success: true,
      report: diagnosticReport,
      extractedSnippet: resumeText.slice(0, 300) + "...",
    });
  } catch (err) {
    console.error("Resume diagnostic error:", err);
    res.status(500).json({ success: false, message: "Failed to analyze resume" });
  }
};

// -------------------------------------------------------------
// Module 6: Interactive AI Mock Interviewer - Start Session
// -------------------------------------------------------------
export const startMockInterview = async (req, res) => {
  const { role = "Full Stack Developer", level = "Entry / Fresher" } = req.body;
  try {
    const firstQuestion = await generateInterviewQuestion(role, level, []);
    res.json({
      success: true,
      role,
      level,
      currentQuestion: firstQuestion,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to initialize interview" });
  }
};

// -------------------------------------------------------------
// Module 6: Next Interview Question with Adaptive Follow-up
// -------------------------------------------------------------
export const nextInterviewQuestion = async (req, res) => {
  const { role, level, history = [] } = req.body;
  try {
    const nextQ = await generateInterviewQuestion(role, level, history);
    res.json({
      success: true,
      currentQuestion: nextQ,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to generate next question" });
  }
};

// -------------------------------------------------------------
// Module 6: Final Interview Scorecard Evaluation
// -------------------------------------------------------------
export const evaluateInterview = async (req, res) => {
  const { role, level, transcript = [] } = req.body;
  if (!Array.isArray(transcript) || transcript.length === 0) {
    return res.status(400).json({ success: false, message: "Valid interview transcript required" });
  }

  try {
    const scorecard = await evaluateInterviewTranscript(role, level, transcript);
    res.json({ success: true, scorecard });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to generate interview evaluation" });
  }
};

// -------------------------------------------------------------
// Module 7: 24/7 AI Career Guidance Chatbot
// -------------------------------------------------------------
export const chatCareerAdvisor = async (req, res) => {
  const { message, chatHistory = [] } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: "Message text required" });
  }

  try {
    let userContext = {};
    if (req.userId) {
      const user = await User.findById(req.userId).select("name role department batch skills");
      if (user) userContext = user.toObject();
    }

    const advice = await generateCareerAdvice(message, chatHistory, userContext);
    res.json({ success: true, reply: advice });
  } catch (err) {
    res.status(500).json({ success: false, message: "Career chatbot error" });
  }
};
