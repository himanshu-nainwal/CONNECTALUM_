import Connection from "../models/Connection.js";
import User from "../models/User.js";

// Send connection request
export const sendRequest = async (req, res) => {
  const { recipientId } = req.body;
  const requesterId = req.userId;

  if (requesterId === recipientId)
    return res.status(400).json({ success: false, message: "Cannot connect with yourself" });

  try {
    const exists = await Connection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });
    if (exists) return res.status(409).json({ success: false, message: "Request already exists", status: exists.status });

    const conn = await Connection.create({ requester: requesterId, recipient: recipientId });
    res.status(201).json({ success: true, connection: conn });
  } catch (err) {
    console.error("Send Request Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Accept / Reject connection
export const respondRequest = async (req, res) => {
  const { connectionId, action } = req.body; // action: "accepted" | "rejected"
  try {
    const conn = await Connection.findOneAndUpdate(
      { _id: connectionId, recipient: req.userId },
      { status: action },
      { new: true }
    );
    if (!conn) return res.status(404).json({ success: false, message: "Connection not found" });
    res.json({ success: true, connection: conn });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get my connections (accepted)
export const getMyConnections = async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [{ requester: req.userId }, { recipient: req.userId }],
      status: "accepted",
    })
      .populate("requester", "name email role company job_role college")
      .populate("recipient", "name email role company job_role college");

    const people = connections.map((c) => {
      const other = c.requester._id.toString() === req.userId ? c.recipient : c.requester;
      return { connectionId: c._id, user: other };
    });
    res.json({ success: true, connections: people });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get pending requests (received)
export const getPendingRequests = async (req, res) => {
  try {
    const pending = await Connection.find({ recipient: req.userId, status: "pending" })
      .populate("requester", "name email role company job_role college");
    res.json({ success: true, requests: pending });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get connection status between two users
export const getConnectionStatus = async (req, res) => {
  const { userId } = req.params;
  try {
    const conn = await Connection.findOne({
      $or: [
        { requester: req.userId, recipient: userId },
        { requester: userId, recipient: req.userId },
      ],
    });
    res.json({ success: true, status: conn?.status || "none", connectionId: conn?._id });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
