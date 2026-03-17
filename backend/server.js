import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRouter from "./routes/userRoute.js";
import jobRouter from "./routes/jobRoute.js";
import mentorRoutes from "./routes/mentorRoute.js";
import eventRoutes from "./routes/eventRoutes.js";
import chatRoutes from "./routes/chatRoute.js";
import connectionRoutes from "./routes/connectionRoute.js";
import messageRoutes from "./routes/messageRoute.js";
import resourceRoutes from "./routes/resourceRoute.js";
import communityRoutes from "./routes/communityRoute.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

// CORS config
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all in dev — tighten in prod
      }
    },
    credentials: true,
  })
);

// Socket.IO for realtime chat
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const chatRooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", (room) => {
    socket.join(room);
    if (!chatRooms[room]) chatRooms[room] = [];
    socket.emit("chat_history", chatRooms[room].slice(-50));
  });

  socket.on("send_message", (data) => {
    const message = {
      id: Date.now(),
      user: data.user,
      text: data.text,
      time: new Date().toISOString(),
      room: data.room,
    };
    if (!chatRooms[data.room]) chatRooms[data.room] = [];
    chatRooms[data.room].push(message);
    io.to(data.room).emit("receive_message", message);
  });

  // Private DM rooms
  socket.on("join_dm", (userId) => socket.join(`dm_${userId}`));

  socket.on("send_dm", (data) => {
    const msg = { id: Date.now(), senderId: data.senderId, senderName: data.senderName, text: data.text, time: new Date().toISOString() };
    io.to(`dm_${data.receiverId}`).emit("receive_dm", msg);
    io.to(`dm_${data.senderId}`).emit("receive_dm", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// API routes
app.use("/api/user", userRouter);
app.use("/api/jobs", jobRouter);
app.use("/api/mentors", mentorRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/communities", communityRoutes);

app.get("/", (req, res) =>
  res.json({ message: "ConnectAlum API v3.0 — MongoDB", status: "running" })
);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

if (process.env.NODE_ENV !== "production") {
  httpServer.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
}

export default app;
