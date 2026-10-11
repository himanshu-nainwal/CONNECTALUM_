import Story from "../models/Story.js";
import User from "../models/User.js";
import { generateStorySummary } from "../services/aiService.js";

// -------------------------------------------------------------
// Get All Stories (with Search, Category, and Moderation filter)
// -------------------------------------------------------------
export const getStories = async (req, res) => {
  const { category, search, company } = req.query;
  try {
    const query = { moderation_status: { $ne: "flagged" } };
    if (category && category !== "all") query.category = category;
    if (company) query.company = { $regex: company, $options: "i" };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
    }

    const stories = await Story.find(query)
      .populate("author", "name role college company job_role is_verified")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      stories: stories.map((s) => ({ ...s.toObject(), id: s._id })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch stories" });
  }
};

// -------------------------------------------------------------
// Get Single Story
// -------------------------------------------------------------
export const getStoryById = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id).populate("author", "name role college company job_role is_verified");
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });
    res.json({ success: true, story: { ...story.toObject(), id: story._id } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// -------------------------------------------------------------
// Create Alumni Story with Automated 3-Bullet AI Executive Summary
// -------------------------------------------------------------
export const createStory = async (req, res) => {
  const { title, content, category, company } = req.body;
  if (!title || !content) {
    return res.status(400).json({ success: false, message: "Title and content required" });
  }

  try {
    // Generate 3-bullet AI summary
    const aiBullets = await generateStorySummary(title, content);

    const user = await User.findById(req.userId).select("role company is_verified");

    const story = await Story.create({
      title,
      content,
      author: req.userId,
      category: category || "Career Journey",
      company: company || user?.company || "",
      ai_summary: aiBullets,
      is_verified: user?.role === "alumni" || !!user?.is_verified,
      moderation_status: "approved",
    });

    const populated = await Story.findById(story._id).populate("author", "name role college company is_verified");
    res.status(201).json({ success: true, story: { ...populated.toObject(), id: populated._id } });
  } catch (err) {
    console.error("Create Story Error:", err);
    res.status(500).json({ success: false, message: "Failed to publish story" });
  }
};

// -------------------------------------------------------------
// Like / Bookmark Story
// -------------------------------------------------------------
export const toggleStoryLike = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });

    const idx = story.likes.indexOf(req.userId);
    if (idx === -1) story.likes.push(req.userId);
    else story.likes.splice(idx, 1);

    await story.save();
    res.json({ success: true, likes: story.likes.length, liked: idx === -1 });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update like" });
  }
};

// -------------------------------------------------------------
// Flag Story (Content Moderation Queue)
// -------------------------------------------------------------
export const flagStory = async (req, res) => {
  const { reason } = req.body;
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: "Story not found" });

    story.is_flagged = true;
    story.flag_reason = reason || "Flagged by community as inappropriate or spam.";
    story.moderation_status = "flagged";
    await story.save();

    res.json({ success: true, message: "Story flagged for admin review" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to flag story" });
  }
};

// -------------------------------------------------------------
// Admin Moderation Queue for Stories
// -------------------------------------------------------------
export const getFlaggedStories = async (req, res) => {
  try {
    const stories = await Story.find({ is_flagged: true }).populate("author", "name email");
    res.json({ success: true, stories });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch flagged stories" });
  }
};

export const moderateStory = async (req, res) => {
  const { action } = req.body; // "approve" or "delete"
  try {
    if (action === "delete") {
      await Story.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: "Story removed by moderator" });
    }
    const story = await Story.findByIdAndUpdate(
      req.params.id,
      { is_flagged: false, flag_reason: "", moderation_status: "approved" },
      { new: true }
    );
    res.json({ success: true, message: "Story approved by moderator", story });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to moderate story" });
  }
};
