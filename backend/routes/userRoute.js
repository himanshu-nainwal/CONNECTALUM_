import express from "express";
import {
  loginUser,
  registerUser,
  getProfile,
  updateProfile,
  getAlumni,
  sendOtp,
  verifyOtp,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/login", loginUser);
userRouter.post("/register", registerUser);
userRouter.post("/send-otp", sendOtp);
userRouter.post("/verify-otp", verifyOtp);
userRouter.get("/me", authMiddleware, getProfile);
userRouter.put("/profile", authMiddleware, updateProfile);
userRouter.get("/alumni", getAlumni);

export default userRouter;
