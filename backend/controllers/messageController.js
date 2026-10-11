import DirectMessage from "../models/DirectMessage.js";
import User from "../models/User.js";

// Send a direct message with optional attachment (PDF resume, etc.)
export const sendMessage = async (req, res) => {
  const { receiverId, text, attachmentUrl, attachmentName, attachmentType } = req.body;
  if (!receiverId || (!text?.trim() && !attachmentUrl))
    return res.status(400).json({ success: false, message: "Receiver and message or attachment required" });

  try {
    const msg = await DirectMessage.create({
      sender: req.userId,
      receiver: receiverId,
      text: text?.trim() || (attachmentName ? `Shared attachment: ${attachmentName}` : "Attachment"),
      attachment_url: attachmentUrl || "",
      attachment_name: attachmentName || "",
      attachment_type: attachmentType || "",
    });

    const populated = await DirectMessage.findById(msg._id).populate("sender", "name role college department is_verified");
    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get conversation between two users
export const getConversation = async (req, res) => {
  const { userId } = req.params;
  try {
    const messages = await DirectMessage.find({
      $or: [
        { sender: req.userId, receiver: userId },
        { sender: userId, receiver: req.userId },
      ],
    })
      .populate("sender", "name role is_verified")
      .sort({ createdAt: 1 });

    // Mark as read
    await DirectMessage.updateMany(
      { sender: userId, receiver: req.userId, read: false },
      { read: true }
    );

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all conversations (inbox)
export const getInbox = async (req, res) => {
  try {
    const userId = req.userId;

    const messages = await DirectMessage.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "name role college company is_verified")
      .populate("receiver", "name role college company is_verified")
      .sort({ createdAt: -1 });

    const seen = new Set();
    const inbox = [];
    for (const msg of messages) {
      const other = msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
      if (!other) continue;
      const key = other._id.toString();
      if (!seen.has(key)) {
        seen.add(key);
        const unread = await DirectMessage.countDocuments({ sender: key, receiver: userId, read: false });
        inbox.push({ user: other, lastMessage: msg, unread });
      }
    }

    res.json({ success: true, inbox });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
