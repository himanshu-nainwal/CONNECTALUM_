import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

// Routes
import userRouter from "./routes/userRoute.js";
import jobRouter from "./routes/jobRoute.js";
import mentorRoutes from "./routes/mentorRoute.js";
import eventRoutes from "./routes/eventRoutes.js";
import chatRoutes from "./routes/chatRoute.js";
import connectionRoutes from "./routes/connectionRoute.js";
import messageRoutes from "./routes/messageRoute.js";
import resourceRoutes from "./routes/resourceRoute.js";
import communityRoutes from "./routes/communityRoute.js";
import adminRouter from "./routes/adminRoute.js";
import aiRouter from "./routes/aiRoute.js";
import qnaRouter from "./routes/qnaRoute.js";
import storyRouter from "./routes/storyRoute.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in development
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// -------------------------------------------------------------
// Socket.IO: Multi-Channel Chatrooms, Presence, Typing & DMs
// -------------------------------------------------------------
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// In-Memory RAM Caches
const chatRooms = {
  general: [],
  jobs: [],
  "tech-talk": [],
  events: [],
};

// Room presence: roomName -> Map(socketId -> { userName, role })
const roomPresence = {
  general: new Map(),
  jobs: new Map(),
  "tech-talk": new Map(),
  events: new Map(),
};

io.on("connection", (socket) => {
  let currentRoom = null;
  let currentUser = null;

  socket.on("join_room", ({ room, user }) => {
    // Leave previous room if any
    if (currentRoom && roomPresence[currentRoom]) {
      socket.leave(currentRoom);
      roomPresence[currentRoom].delete(socket.id);
      io.to(currentRoom).emit("room_presence", {
        room: currentRoom,
        count: roomPresence[currentRoom].size,
        users: Array.from(roomPresence[currentRoom].values()),
      });
    }

    currentRoom = room || "general";
    currentUser = user || { name: "Guest", role: "student" };
    socket.join(currentRoom);

    if (!chatRooms[currentRoom]) chatRooms[currentRoom] = [];
    if (!roomPresence[currentRoom]) roomPresence[currentRoom] = new Map();

    roomPresence[currentRoom].set(socket.id, currentUser);

    // Send instant last 50 RAM-cached messages
    socket.emit("chat_history", chatRooms[currentRoom].slice(-50));

    // Broadcast updated presence
    io.to(currentRoom).emit("room_presence", {
      room: currentRoom,
      count: roomPresence[currentRoom].size,
      users: Array.from(roomPresence[currentRoom].values()),
    });
  });

  socket.on("send_message", (data) => {
    const targetRoom = data.room || "general";
    const message = {
      id: Date.now(),
      user: data.user,
      role: data.role || "student",
      text: data.text,
      time: new Date().toISOString(),
      room: targetRoom,
    };

    if (!chatRooms[targetRoom]) chatRooms[targetRoom] = [];
    chatRooms[targetRoom].push(message);
    if (chatRooms[targetRoom].length > 100) chatRooms[targetRoom].shift();

    io.to(targetRoom).emit("receive_message", message);
  });

  // Private DM Rooms
  socket.on("join_dm", (userId) => {
    socket.join(`dm_${userId}`);
  });

  socket.on("send_dm", (data) => {
    const msg = {
      id: Date.now(),
      senderId: data.senderId,
      senderName: data.senderName,
      text: data.text,
      attachment_url: data.attachment_url || "",
      attachment_name: data.attachment_name || "",
      time: new Date().toISOString(),
    };
    io.to(`dm_${data.receiverId}`).emit("receive_dm", msg);
    io.to(`dm_${data.senderId}`).emit("receive_dm", msg);
  });

  // Live Typing Indicators
  socket.on("typing", (data) => {
    if (data.receiverId) {
      io.to(`dm_${data.receiverId}`).emit("user_typing", { senderId: data.senderId, senderName: data.senderName });
    }
  });

  socket.on("stop_typing", (data) => {
    if (data.receiverId) {
      io.to(`dm_${data.receiverId}`).emit("user_stop_typing", { senderId: data.senderId });
    }
  });

  socket.on("disconnect", () => {
    if (currentRoom && roomPresence[currentRoom]) {
      roomPresence[currentRoom].delete(socket.id);
      io.to(currentRoom).emit("room_presence", {
        room: currentRoom,
        count: roomPresence[currentRoom].size,
        users: Array.from(roomPresence[currentRoom].values()),
      });
    }
  });
});

// -------------------------------------------------------------
// REST API Routes
// -------------------------------------------------------------
app.get("/health", (req, res) =>
  res.json({
    status: "ok",
    service: "ConnectAlum Platform API v4.0",
    timestamp: new Date().toISOString(),
  })
);

app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/ai", aiRouter);
app.use("/api/jobs", jobRouter);
app.use("/api/mentors", mentorRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/qna", qnaRouter);
app.use("/api/stories", storyRouter);

app.get("/", (req, res) =>
  res.json({
    message: "ConnectAlum: AI-Driven Alumni Mentorship, Career Referral & Community Platform",
    status: "running",
    version: "4.0",
  })
);

// Global error handler
app.use((err, req, res, next) => {
  console.error("ConnectAlum Server Error:", err);
  res.status(500).json({ success: false, message: err.message || "Internal server error" });
});

httpServer.listen(port, () => {
  console.log(`🚀 ConnectAlum Server running on http://localhost:${port}`);
});
