import Resource from "../models/Resource.js";

// Create resource
export const createResource = async (req, res) => {
  const { title, description, type, content, tags, subject, company } = req.body;
  if (!title || !content)
    return res.status(400).json({ success: false, message: "Title and content required" });

  try {
    const resource = await Resource.create({
      title,
      description,
      type: type || "notes",
      content,
      tags: Array.isArray(tags) ? tags : (tags || "").split(",").map((t) => t.trim()).filter(Boolean),
      subject,
      company: company || "",
      posted_by: req.userId,
      is_verified: true,
      moderation_status: "approved",
    });

    const pop = await Resource.findById(resource._id).populate("posted_by", "name role college company is_verified");
    res.status(201).json({ success: true, resource: { ...pop.toObject(), id: pop._id } });
  } catch (err) {
    console.error("Create Resource Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all resources
export const getResources = async (req, res) => {
  const { search, type, subject, company } = req.query;
  try {
    const query = { moderation_status: { $ne: "flagged" } };
    if (type && type !== "all") query.type = type;
    if (subject) query.subject = { $regex: subject, $options: "i" };
    if (company) query.company = { $regex: company, $options: "i" };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
        { subject: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
    }

    const resources = await Resource.find(query)
      .populate("posted_by", "name role college company is_verified")
      .sort({ createdAt: -1 });

    res.json(resources.map((r) => ({ ...r.toObject(), id: r._id })));
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Like / unlike a resource
export const toggleLike = async (req, res) => {
  const { id } = req.params;
  try {
    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ success: false, message: "Not found" });

    const idx = resource.likes.indexOf(req.userId);
    if (idx === -1) resource.likes.push(req.userId);
    else resource.likes.splice(idx, 1);

    await resource.save();
    res.json({ success: true, likes: resource.likes.length, liked: idx === -1 });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Bookmark / unbookmark resource
export const toggleBookmark = async (req, res) => {
  const { id } = req.params;
  try {
    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ success: false, message: "Not found" });

    const idx = resource.bookmarks.indexOf(req.userId);
    if (idx === -1) resource.bookmarks.push(req.userId);
    else resource.bookmarks.splice(idx, 1);

    await resource.save();
    res.json({ success: true, bookmarks: resource.bookmarks.length, bookmarked: idx === -1 });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Increment download counter
export const incrementDownload = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );
    if (!resource) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, downloads: resource.downloads });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Flag resource (Moderation queue)
export const flagResource = async (req, res) => {
  const { reason } = req.body;
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: "Not found" });

    resource.is_flagged = true;
    resource.flag_reason = reason || "Spam or irrelevant material.";
    resource.moderation_status = "flagged";
    await resource.save();

    res.json({ success: true, message: "Resource flagged for admin review" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete resource (owner or admin)
export const deleteResource = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.userRole !== "admin" && req.userRole !== "master_admin") {
      query.posted_by = req.userId;
    }
    const resource = await Resource.findOneAndDelete(query);
    if (!resource) return res.status(404).json({ success: false, message: "Not found or unauthorized" });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
