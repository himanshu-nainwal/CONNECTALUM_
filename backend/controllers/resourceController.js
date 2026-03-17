import Resource from "../models/Resource.js";

// Create resource (alumni only)
export const createResource = async (req, res) => {
  const { title, description, type, content, tags, subject } = req.body;
  if (!title || !content)
    return res.status(400).json({ success: false, message: "Title and content required" });

  try {
    const resource = await Resource.create({
      title, description, type: type || "notes", content,
      tags: Array.isArray(tags) ? tags : tags?.split(",").map(t => t.trim()).filter(Boolean) || [],
      subject,
      posted_by: req.userId,
    });
    const pop = await Resource.findById(resource._id).populate("posted_by", "name role college");
    res.status(201).json({ success: true, resource: { ...pop.toObject(), id: pop._id } });
  } catch (err) {
    console.error("Create Resource Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all resources
export const getResources = async (req, res) => {
  const { search, type, subject } = req.query;
  try {
    const query = {};
    if (type && type !== "all") query.type = type;
    if (subject) query.subject = { $regex: subject, $options: "i" };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }
    const resources = await Resource.find(query)
      .populate("posted_by", "name role college company")
      .sort({ createdAt: -1 });
    res.json(resources.map(r => ({ ...r.toObject(), id: r._id })));
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

// Delete resource (owner only)
export const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findOneAndDelete({ _id: req.params.id, posted_by: req.userId });
    if (!resource) return res.status(404).json({ success: false, message: "Not found or unauthorized" });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
