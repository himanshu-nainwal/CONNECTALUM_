import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
import User from "../models/User.js";
import { computeSemanticJobMatch } from "../services/aiService.js";

// -------------------------------------------------------------
// Create Job (Alumni / Admin)
// -------------------------------------------------------------
export const createJob = async (req, res) => {
  const {
    title,
    company,
    location,
    type,
    description,
    salary_range,
    requirements,
    skills_required,
    eligible_batches,
    eligible_departments,
    referral_available,
  } = req.body;
  const posted_by = req.userId;

  if (!title || !company || !location || !type)
    return res.status(400).json({ success: false, message: "Title, company, location, type required" });

  try {
    const job = await Job.create({
      title,
      company,
      location,
      type,
      description,
      salary_range,
      requirements,
      skills_required: Array.isArray(skills_required)
        ? skills_required
        : (skills_required || "").split(",").map((s) => s.trim()).filter(Boolean),
      eligible_batches: Array.isArray(eligible_batches)
        ? eligible_batches.map(Number)
        : (eligible_batches || "").toString().split(",").map((b) => parseInt(b.trim())).filter(Boolean),
      eligible_departments: Array.isArray(eligible_departments)
        ? eligible_departments
        : (eligible_departments || "").split(",").map((d) => d.trim()).filter(Boolean),
      referral_available: referral_available !== undefined ? referral_available : true,
      posted_by,
    });

    const populated = await Job.findById(job._id).populate("posted_by", "name email college company");
    res.status(201).json({ success: true, job: { ...populated.toObject(), id: populated._id } });
  } catch (err) {
    console.error("Create Job Error:", err);
    res.status(500).json({ success: false, message: "Failed to create job" });
  }
};

// -------------------------------------------------------------
// Get Jobs with Optional Filters
// -------------------------------------------------------------
export const getJobs = async (req, res) => {
  const { type, search, location, department, batch } = req.query;
  try {
    const query = {};
    if (type && type !== "all") query.type = type;
    if (location) query.location = { $regex: location, $options: "i" };
    if (department) query.eligible_departments = { $in: [new RegExp(department, "i")] };
    if (batch) query.eligible_batches = { $in: [parseInt(batch)] };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { skills_required: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const jobs = await Job.find(query)
      .populate("posted_by", "name email college company")
      .sort({ createdAt: -1 });

    res.json(jobs.map((j) => ({ ...j.toObject(), id: j._id, users: j.posted_by })));
  } catch (err) {
    console.error("Get Jobs Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch jobs" });
  }
};

// -------------------------------------------------------------
// Module 3: AI Semantic Job Matching Engine
// -------------------------------------------------------------
export const getSemanticJobMatches = async (req, res) => {
  try {
    const student = await User.findById(req.userId).select("skills department batch grad_year resume_text");
    if (!student) return res.status(404).json({ success: false, message: "Student profile not found" });

    const jobs = await Job.find().populate("posted_by", "name email college company").sort({ createdAt: -1 });

    const matchedJobs = await Promise.all(
      jobs.map(async (job) => {
        const matchAnalysis = await computeSemanticJobMatch(student, job);

        // Check academic eligibility
        let isBatchEligible = true;
        let isDeptEligible = true;

        if (job.eligible_batches && job.eligible_batches.length > 0 && student.batch) {
          isBatchEligible = job.eligible_batches.includes(student.batch);
        }
        if (job.eligible_departments && job.eligible_departments.length > 0 && student.department) {
          isDeptEligible = job.eligible_departments.some((d) =>
            student.department.toLowerCase().includes(d.toLowerCase())
          );
        }

        return {
          ...job.toObject(),
          id: job._id,
          users: job.posted_by,
          ai_match: matchAnalysis,
          is_eligible: isBatchEligible && isDeptEligible,
          eligibility_details: { isBatchEligible, isDeptEligible },
        };
      })
    );

    // Sort by AI match score descending
    matchedJobs.sort((a, b) => (b.ai_match?.match_score || 0) - (a.ai_match?.match_score || 0));

    res.json({ success: true, jobs: matchedJobs });
  } catch (err) {
    console.error("Semantic Match Error:", err);
    res.status(500).json({ success: false, message: "Failed to compute semantic matches" });
  }
};

// -------------------------------------------------------------
// Get Jobs Posted by Current User
// -------------------------------------------------------------
export const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ posted_by: req.userId }).sort({ createdAt: -1 });
    res.json(jobs.map((j) => ({ ...j.toObject(), id: j._id })));
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch your jobs" });
  }
};

// -------------------------------------------------------------
// Delete Job
// -------------------------------------------------------------
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, posted_by: req.userId });
    if (!job) return res.status(404).json({ success: false, message: "Job not found or unauthorized" });
    res.json({ success: true, message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete job" });
  }
};

// -------------------------------------------------------------
// Apply / Request Referral for a Job
// -------------------------------------------------------------
export const applyToJob = async (req, res) => {
  const { jobId, coverNote, resumeLink } = req.body;
  if (!jobId) return res.status(400).json({ success: false, message: "Job ID required" });

  try {
    const existing = await JobApplication.findOne({ job_id: jobId, applicant: req.userId });
    if (existing) return res.status(409).json({ success: false, message: "Already applied / requested referral" });

    const application = await JobApplication.create({
      job_id: jobId,
      applicant: req.userId,
      cover_note: coverNote || "",
      resume_link: resumeLink || "",
      status: "Pending",
    });

    res.status(201).json({ success: true, application });
  } catch (err) {
    console.error("Apply Job Error:", err);
    res.status(500).json({ success: false, message: "Failed to apply" });
  }
};

// -------------------------------------------------------------
// Module 4: Student Referral Status Tracker
// -------------------------------------------------------------
export const getMyApplications = async (req, res) => {
  try {
    const apps = await JobApplication.find({ applicant: req.userId })
      .populate({
        path: "job_id",
        select: "title company location type salary_range",
        populate: { path: "posted_by", select: "name company email" },
      })
      .sort({ createdAt: -1 });

    res.json(apps.map((a) => ({ ...a.toObject(), id: a._id })));
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch applications" });
  }
};

// -------------------------------------------------------------
// Module 4: Alumni Applicant Review Dashboard
// -------------------------------------------------------------
export const getAlumniReferrals = async (req, res) => {
  try {
    const myJobs = await Job.find({ posted_by: req.userId }).select("_id");
    const jobIds = myJobs.map((j) => j._id);

    const applications = await JobApplication.find({ job_id: { $in: jobIds } })
      .populate("applicant", "name email college department batch skills github leetcode linkedin resume_url")
      .populate("job_id", "title company location type")
      .sort({ createdAt: -1 });

    res.json(applications.map((a) => ({ ...a.toObject(), id: a._id })));
  } catch (err) {
    console.error("Alumni referrals error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch referral applications" });
  }
};

// -------------------------------------------------------------
// Module 4: 1-Click Referral Grant / Decline Pipeline
// -------------------------------------------------------------
export const updateReferralStatus = async (req, res) => {
  const { id } = req.params;
  const { status, alumniNotes } = req.body;

  if (!["Pending", "Granted", "Declined"].includes(status)) {
    return res.status(400).json({ success: false, message: "Valid status required (Pending, Granted, Declined)" });
  }

  try {
    const app = await JobApplication.findById(id).populate("job_id");
    if (!app) return res.status(404).json({ success: false, message: "Application not found" });

    // Verify alumni owns the job
    if (app.job_id.posted_by.toString() !== req.userId.toString() && req.userRole !== "admin" && req.userRole !== "master_admin") {
      return res.status(403).json({ success: false, message: "Unauthorized to review this referral request" });
    }

    const previousStatus = app.status;
    app.status = status;
    if (alumniNotes !== undefined) app.alumni_notes = alumniNotes;
    app.reviewed_by = req.userId;
    app.reviewed_at = new Date();
    await app.save();

    // If newly Granted, increment alumni referrals counter
    if (status === "Granted" && previousStatus !== "Granted") {
      await User.findByIdAndUpdate(req.userId, { $inc: { referrals_granted: 1 } });
    }

    res.json({ success: true, message: `Referral status set to ${status}`, application: app });
  } catch (err) {
    console.error("Update referral status error:", err);
    res.status(500).json({ success: false, message: "Failed to update referral status" });
  }
};

// -------------------------------------------------------------
// Module 4: Alumni Referral Leaderboard
// -------------------------------------------------------------
export const getReferralLeaderboard = async (req, res) => {
  try {
    const topAlumni = await User.find({ role: "alumni", referrals_granted: { $gt: 0 } })
      .select("name company job_role college department referrals_granted")
      .sort({ referrals_granted: -1 })
      .limit(10);

    // If empty or small, supplement with active alumni
    if (topAlumni.length < 5) {
      const moreAlumni = await User.find({ role: "alumni" })
        .select("name company job_role college department referrals_granted")
        .sort({ referrals_granted: -1, createdAt: -1 })
        .limit(10);
      return res.json({ success: true, leaderboard: moreAlumni });
    }

    res.json({ success: true, leaderboard: topAlumni });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch leaderboard" });
  }
};
