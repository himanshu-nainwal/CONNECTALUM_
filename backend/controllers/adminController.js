import User from "../models/User.js";
import Whitelist from "../models/Whitelist.js";

// -----------------------------------------------------------------
// Get all users with filters and statistics
// -----------------------------------------------------------------
export const getAllUsers = async (req, res) => {
  const { role, batch, department, search, status } = req.query;
  try {
    const query = {};
    if (role && role !== "all") query.role = role;
    if (batch) query.batch = parseInt(batch);
    if (department && department !== "all") query.department = { $regex: department, $options: "i" };
    if (status === "banned") query.is_banned = true;
    if (status === "backlog") query.has_backlog = true;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).select("-password").sort({ createdAt: -1 });

    const totalStudents = await User.countDocuments({ role: "student" });
    const totalAlumni = await User.countDocuments({ role: "alumni" });
    const totalAdmins = await User.countDocuments({ role: { $in: ["admin", "master_admin"] } });
    const totalWhitelisted = await Whitelist.countDocuments();
    const totalBacklogs = await User.countDocuments({ role: "student", has_backlog: true });

    res.json({
      success: true,
      users,
      stats: {
        totalUsers: users.length,
        totalStudents,
        totalAlumni,
        totalAdmins,
        totalWhitelisted,
        totalBacklogs,
      },
    });
  } catch (err) {
    console.error("Admin fetch users error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

// -----------------------------------------------------------------
// Sub-Admin Promotion and Privilege Delegation
// -----------------------------------------------------------------
export const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["student", "alumni", "admin", "master_admin"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid target role" });
  }

  try {
    // Only master_admin can create another master_admin or admin
    if (role === "master_admin" && req.userRole !== "master_admin") {
      return res.status(403).json({ success: false, message: "Only Master Admin can assign Master Admin privilege" });
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, message: `User role updated to ${role}`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update role" });
  }
};

// -----------------------------------------------------------------
// Account Suspension and Ban Controls
// -----------------------------------------------------------------
export const toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const { is_suspended, is_banned } = req.body;

  try {
    const target = await User.findById(id);
    if (!target) return res.status(404).json({ success: false, message: "User not found" });
    if (target.role === "master_admin") {
      return res.status(403).json({ success: false, message: "Cannot suspend Master Admin account" });
    }

    if (is_suspended !== undefined) target.is_suspended = is_suspended;
    if (is_banned !== undefined) target.is_banned = is_banned;

    await target.save();
    res.json({ success: true, message: "User account status updated", user: target });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update account status" });
  }
};

// -----------------------------------------------------------------
// Student Backlog / Detention Status Toggle
// -----------------------------------------------------------------
export const toggleBacklogStatus = async (req, res) => {
  const { id } = req.params;
  const { has_backlog } = req.body;

  try {
    const user = await User.findByIdAndUpdate(id, { has_backlog: !!has_backlog }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "Student backlog status updated", user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update backlog status" });
  }
};

// -----------------------------------------------------------------
// Bulk Whitelist CSV / Roster Upload
// -----------------------------------------------------------------
export const bulkUploadWhitelist = async (req, res) => {
  const { entries } = req.body; // Array of { email, name, role, batch, department }
  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ success: false, message: "Valid roster entries array required" });
  }

  try {
    let addedCount = 0;
    let skippedCount = 0;

    for (const item of entries) {
      if (!item.email) continue;
      const email = item.email.toLowerCase().trim();
      const existing = await Whitelist.findOne({ email });
      if (existing) {
        skippedCount++;
        continue;
      }
      await Whitelist.create({
        email,
        name: item.name || "",
        role: item.role || "student",
        batch: item.batch ? parseInt(item.batch) : 2026,
        department: item.department || "Computer Science & Engineering",
      });
      addedCount++;
    }

    res.json({
      success: true,
      message: `Roster upload complete: ${addedCount} emails added, ${skippedCount} skipped (already present).`,
      addedCount,
      skippedCount,
    });
  } catch (err) {
    console.error("Bulk whitelist error:", err);
    res.status(500).json({ success: false, message: "Roster upload failed" });
  }
};

// -----------------------------------------------------------------
// Get Whitelist Roster
// -----------------------------------------------------------------
export const getWhitelist = async (req, res) => {
  try {
    const roster = await Whitelist.find().sort({ createdAt: -1 });
    res.json({ success: true, roster });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch whitelist" });
  }
};

// -----------------------------------------------------------------
// Delete Whitelist Entry
// -----------------------------------------------------------------
export const deleteWhitelistEntry = async (req, res) => {
  try {
    await Whitelist.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Whitelist entry removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to remove entry" });
  }
};

// -----------------------------------------------------------------
// Automated Annual Batch Graduation Migration Engine
// -----------------------------------------------------------------
export const runBatchGraduationMigration = async (req, res) => {
  const { batchYear, excludeBacklogs = true, manualExcludedIds = [] } = req.body;
  if (!batchYear) {
    return res.status(400).json({ success: false, message: "Target batch graduation year required (e.g. 2026)" });
  }

  try {
    const year = parseInt(batchYear);

    // Find all student accounts in that batch year
    const query = {
      role: "student",
      $or: [{ batch: year }, { grad_year: year }],
    };

    const eligibleStudents = await User.find(query).select("name email batch grad_year department has_backlog");

    const toGraduate = [];
    const excludedDueToBacklog = [];
    const manuallyExcluded = [];

    eligibleStudents.forEach((student) => {
      if (manualExcludedIds.includes(student._id.toString())) {
        manuallyExcluded.push(student);
      } else if (excludeBacklogs && student.has_backlog) {
        excludedDueToBacklog.push(student);
      } else {
        toGraduate.push(student);
      }
    });

    // Migrate eligible students to alumni
    const idsToGraduate = toGraduate.map((s) => s._id);
    const updateResult = await User.updateMany(
      { _id: { $in: idsToGraduate } },
      { $set: { role: "alumni", is_verified: true } }
    );

    res.json({
      success: true,
      message: `Batch ${year} Graduation completed successfully!`,
      report: {
        batchYear: year,
        totalEvaluated: eligibleStudents.length,
        graduatedCount: updateResult.modifiedCount,
        excludedCount: excludedDueToBacklog.length + manuallyExcluded.length,
        excludedDueToBacklog,
        manuallyExcluded,
        graduatedStudents: toGraduate.map((s) => ({ id: s._id, name: s.name, email: s.email, department: s.department })),
      },
    });
  } catch (err) {
    console.error("Batch Graduation Migration Error:", err);
    res.status(500).json({ success: false, message: "Graduation migration engine encountered an error" });
  }
};
