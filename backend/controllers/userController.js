import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

const createToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "connectalum_secret_key", { expiresIn: "7d" });
};

// Login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: "Email and password required" });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

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

// Register
export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ success: false, message: "All fields required" });

  try {
    if (!validator.isEmail(email))
      return res.status(400).json({ success: false, message: "Invalid email" });
    if (password.length < 8)
      return res.status(400).json({ success: false, message: "Password must be 8+ chars" });
    if (!["student", "alumni"].includes(role))
      return res.status(400).json({ success: false, message: "Invalid role" });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ success: false, message: "Email already registered" });

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    });

    const token = createToken(newUser._id, newUser.role);
    const { password: _, ...safeUser } = newUser.toObject();
    res.status(201).json({ success: true, token, role: newUser.role, user: { ...safeUser, id: safeUser._id } });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get own profile (requires auth)
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user: { ...user.toObject(), id: user._id } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update Profile (requires auth)
export const updateProfile = async (req, res) => {
  const userId = req.userId;
  const { college, grad_year, department, skills, job_role, company, name } = req.body;

  try {
    const updates = {};
    if (college !== undefined) updates.college = college;
    if (grad_year !== undefined) updates.grad_year = parseInt(grad_year);
    if (department !== undefined) updates.department = department;
    if (skills !== undefined)
      updates.skills = Array.isArray(skills) ? skills : skills.split(",").map((s) => s.trim()).filter(Boolean);
    if (job_role !== undefined) updates.job_role = job_role;
    if (company !== undefined) updates.company = company;
    if (name !== undefined) updates.name = name;

    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, user: { ...user.toObject(), id: user._id } });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

// Get Alumni list
export const getAlumni = async (req, res) => {
  const { college, department, search } = req.query;
  try {
    const query = { role: "alumni" };

    if (college) query.college = { $regex: college, $options: "i" };
    if (department) query.department = { $regex: department, $options: "i" };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { job_role: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("name email college grad_year department job_role company skills createdAt")
      .sort({ createdAt: -1 });

    res.json(users.map((u) => ({ ...u.toObject(), id: u._id })));
  } catch (err) {
    console.error("Fetch Alumni Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch alumni" });
  }
};
