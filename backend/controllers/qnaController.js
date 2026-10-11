import Question from "../models/Question.js";
import User from "../models/User.js";
import { generateQnaDraftAnswer } from "../services/aiService.js";

// -------------------------------------------------------------
// Get All Questions with Search / Auto-Suggestions
// -------------------------------------------------------------
export const getQuestions = async (req, res) => {
  const { search, tag, status } = req.query;
  try {
    const query = {};
    if (tag) query.tags = { $in: [tag] };
    if (status === "solved") query.is_solved = true;
    if (status === "unsolved") query.is_solved = false;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const questions = await Question.find(query)
      .populate("author", "name role college department is_verified")
      .populate("answers.author", "name role company job_role is_verified")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      questions: questions.map((q) => ({
        ...q.toObject(),
        id: q._id,
        answerCount: q.answers.length,
        upvoteCount: q.upvotes.length,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch questions" });
  }
};

// -------------------------------------------------------------
// Get Question By ID (Increments view counter)
// -------------------------------------------------------------
export const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate("author", "name role college department is_verified")
      .populate("answers.author", "name role company job_role is_verified");

    if (!question) return res.status(404).json({ success: false, message: "Question not found" });

    res.json({ success: true, question: { ...question.toObject(), id: question._id } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch question" });
  }
};

// -------------------------------------------------------------
// Create Question with Instant AI Draft Answer
// -------------------------------------------------------------
export const createQuestion = async (req, res) => {
  const { title, description, tags } = req.body;
  if (!title || !description) {
    return res.status(400).json({ success: false, message: "Title and description required" });
  }

  try {
    // Generate AI draft answer immediately
    const aiDraft = await generateQnaDraftAnswer(title, description);

    const question = await Question.create({
      title,
      description,
      tags: Array.isArray(tags) ? tags : (tags || "").split(",").map((t) => t.trim()).filter(Boolean),
      author: req.userId,
      ai_draft_answer: aiDraft,
    });

    const populated = await Question.findById(question._id).populate("author", "name role college is_verified");

    res.status(201).json({ success: true, question: { ...populated.toObject(), id: populated._id } });
  } catch (err) {
    console.error("Create question error:", err);
    res.status(500).json({ success: false, message: "Failed to post question" });
  }
};

// -------------------------------------------------------------
// Submit Answer (with Verified Alumni Badge check)
// -------------------------------------------------------------
export const addAnswer = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: "Answer text required" });
  }

  try {
    const question = await Question.findById(id);
    if (!question) return res.status(404).json({ success: false, message: "Question not found" });

    const user = await User.findById(req.userId).select("role is_verified");
    const isAlumni = user && user.role === "alumni";

    question.answers.push({
      author: req.userId,
      text: text.trim(),
      is_verified_alumni: isAlumni,
      is_accepted: false,
      upvotes: [],
    });

    await question.save();

    const updated = await Question.findById(id)
      .populate("author", "name role college is_verified")
      .populate("answers.author", "name role company job_role is_verified");

    res.status(201).json({ success: true, question: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to submit answer" });
  }
};

// -------------------------------------------------------------
// Mark Accepted Answer (by question author)
// -------------------------------------------------------------
export const markAcceptedAnswer = async (req, res) => {
  const { id, answerId } = req.params;
  try {
    const question = await Question.findById(id);
    if (!question) return res.status(404).json({ success: false, message: "Question not found" });

    if (question.author.toString() !== req.userId.toString() && req.userRole !== "admin" && req.userRole !== "master_admin") {
      return res.status(403).json({ success: false, message: "Only the author can mark an accepted answer" });
    }

    question.answers.forEach((ans) => {
      ans.is_accepted = ans._id.toString() === answerId;
    });
    question.is_solved = true;
    await question.save();

    res.json({ success: true, message: "Answer accepted", question });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to accept answer" });
  }
};

// -------------------------------------------------------------
// Upvote Question / Answer
// -------------------------------------------------------------
export const toggleQuestionUpvote = async (req, res) => {
  const { id } = req.params;
  try {
    const question = await Question.findById(id);
    if (!question) return res.status(404).json({ success: false, message: "Question not found" });

    const idx = question.upvotes.indexOf(req.userId);
    if (idx === -1) question.upvotes.push(req.userId);
    else question.upvotes.splice(idx, 1);

    await question.save();
    res.json({ success: true, upvoteCount: question.upvotes.length, upvoted: idx === -1 });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to upvote" });
  }
};
