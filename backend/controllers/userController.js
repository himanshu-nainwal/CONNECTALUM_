import User from "../models/User.js";
import Whitelist from "../models/Whitelist.js";
import Otp from "../models/Otp.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import validator from "validator";
import { sendOtpEmail } from "../services/emailService.js";

const createToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "connectalum_super_secret_key_change_in_production", { expiresIn: "7d" });
};

// -----------------------------------------------------------------
// Send 6-digit Email OTP
// -----------------------------------------------------------------
export const sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ success: false, message: "Valid email required" });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Check whitelist if whitelist roster is populated
    const totalWhitelisted = await Whitelist.countDocuments();
    if (totalWhitelisted > 0) {
      const isWhitelisted = await Whitelist.findOne({ email: normalizedEmail });
      if (!isWhitelisted) {
        return res.status(403).json({
          success: false,
          message: "Email is not present in institutional whitelist roster. Please reach out to college administration.",
        });
      }
    }

    // Generate random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await Otp.deleteMany({ email: normalizedEmail });
    await Otp.create({ email: normalizedEmail, otp: otpCode, expiresAt });

    await sendOtpEmail(normalizedEmail, otpCode);

    res.json({
      success: true,
      message: `OTP sent to ${normalizedEmail}`,
      devOtp: otpCode, // Provided for effortless local evaluation without SMTP configuration
    });
  } catch (err) {
    console.error("Send OTP Error:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// -----------------------------------------------------------------
// Verify OTP
// -----------------------------------------------------------------
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "Email and OTP required" });
  }

  try {
    const record = await Otp.findOne({ email: email.toLowerCase().trim(), otp: otp.trim() });
    if (!record) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP code" });
    }
    res.json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};

// -----------------------------------------------------------------
// User Login
// -----------------------------------------------------------------
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: "Email and password required" });

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.is_banned) {
      return res.status(403).json({ success: false, message: "Your account has been suspended by administration." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = createToken(user._id, user.role);
    const { password: _, ...safeUser } = user.toObject();
    res.json({ success: true, token, role: user.role, user: { ...safeUser, id: safeUser._id } });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------------------------------------------
// User Register (with Whitelist & OTP check)
// -----------------------------------------------------------------
export const registerUser = async (req, res) => {
  const { name, email, password, role, otp, batch, department, college } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ success: false, message: "All fields required" });

  try {
    const normalizedEmail = email.toLowerCase().trim();

    if (!validator.isEmail(normalizedEmail))
      return res.status(400).json({ success: false, message: "Invalid email" });
    if (password.length < 8)
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    if (!["student", "alumni", "admin", "master_admin"].includes(role))
      return res.status(400).json({ success: false, message: "Invalid role specified" });

    // Whitelist check
    const totalWhitelisted = await Whitelist.countDocuments();
    if (totalWhitelisted > 0) {
      const whitelisted = await Whitelist.findOne({ email: normalizedEmail });
      if (!whitelisted) {
        return res.status(403).json({
          success: false,
          message: "Email is not in the approved institutional whitelist.",
        });
      }
      // Update whitelist status
      whitelisted.status = "registered";
      await whitelisted.save();
    }

    // OTP verification check if otp provided or configured
    if (otp) {
      const otpRecord = await Otp.findOne({ email: normalizedEmail, otp: otp.trim() });
      if (!otpRecord) {
        return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
      }
      await Otp.deleteMany({ email: normalizedEmail });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ success: false, message: "Email already registered" });

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      batch: batch ? parseInt(batch) : 2026,
      grad_year: batch ? parseInt(batch) : 2026,
      department: department || "Computer Science & Engineering",
      college: college || "Graphic Era Hill University",
      is_verified: true,
    });

    const token = createToken(newUser._id, newUser.role);
    const { password: _, ...safeUser } = newUser.toObject();
    res.status(201).json({ success: true, token, role: newUser.role, user: { ...safeUser, id: safeUser._id } });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------------------------------------------
// Get Own Profile
// -----------------------------------------------------------------
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user: { ...user.toObject(), id: user._id } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// -----------------------------------------------------------------
// Update Profile
// -----------------------------------------------------------------
export const updateProfile = async (req, res) => {
  const userId = req.userId;
  const { college, grad_year, batch, department, skills, job_role, company, name, bio, github, leetcode, linkedin, resume_url, resume_text } = req.body;

  try {
    const updates = {};
    if (college !== undefined) updates.college = college;
    if (grad_year !== undefined) updates.grad_year = parseInt(grad_year);
    if (batch !== undefined) updates.batch = parseInt(batch);
    if (department !== undefined) updates.department = department;
    if (skills !== undefined)
      updates.skills = Array.isArray(skills) ? skills : skills.split(",").map((s) => s.trim()).filter(Boolean);
    if (job_role !== undefined) updates.job_role = job_role;
    if (company !== undefined) updates.company = company;
    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (github !== undefined) updates.github = github;
    if (leetcode !== undefined) updates.leetcode = leetcode;
    if (linkedin !== undefined) updates.linkedin = linkedin;
    if (resume_url !== undefined) updates.resume_url = resume_url;
    if (resume_text !== undefined) updates.resume_text = resume_text;

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, user: { ...user.toObject(), id: user._id } });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

// -----------------------------------------------------------------
// Get Alumni List with Verified Profile Badges
// -----------------------------------------------------------------
export const getAlumni = async (req, res) => {
  const { college, department, search, batch } = req.query;
  try {
    const query = { role: "alumni", is_banned: false };

    if (college) query.college = { $regex: college, $options: "i" };
    if (department) query.department = { $regex: department, $options: "i" };
    if (batch) query.batch = parseInt(batch);
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { job_role: { $regex: search, $options: "i" } },
        { skills: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const users = await User.find(query)
      .select("name email college grad_year batch department job_role company skills bio github leetcode linkedin is_verified referrals_granted createdAt")
      .sort({ createdAt: -1 });

    res.json(users.map((u) => ({ ...u.toObject(), id: u._id })));
  } catch (err) {
    console.error("Fetch Alumni Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch alumni" });
  }
};
