import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";

export const createJob = async (req, res) => {
  const { title, company, location, type, description, salary_range, requirements } = req.body;
  const posted_by = req.userId;

  if (!title || !company || !location || !type)
    return res.status(400).json({ success: false, message: "Title, company, location, type required" });

  try {
    const job = await Job.create({ title, company, location, type, description, salary_range, requirements, posted_by });
    const populated = await Job.findById(job._id).populate("posted_by", "name email college");
    res.status(201).json({ success: true, job: { ...populated.toObject(), id: populated._id } });
  } catch (err) {
    console.error("Create Job Error:", err);
    res.status(500).json({ success: false, message: "Failed to create job" });
  }
};

export const getJobs = async (req, res) => {
  const { type, search, location } = req.query;
  try {
    const query = {};
    if (type && type !== "all") query.type = type;
    if (location) query.location = { $regex: location, $options: "i" };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const jobs = await Job.find(query)
      .populate("posted_by", "name email college")
      .sort({ createdAt: -1 });

    res.json(jobs.map((j) => ({ ...j.toObject(), id: j._id, users: j.posted_by })));
  } catch (err) {
    console.error("Get Jobs Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch jobs" });
  }
};

export const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ posted_by: req.userId }).sort({ createdAt: -1 });
    res.json(jobs.map((j) => ({ ...j.toObject(), id: j._id })));
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch your jobs" });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, posted_by: req.userId });
    if (!job) return res.status(404).json({ success: false, message: "Job not found or unauthorized" });
    res.json({ success: true, message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete job" });
  }
};

export const applyToJob = async (req, res) => {
  const { jobId, coverNote } = req.body;
  if (!jobId) return res.status(400).json({ success: false, message: "Job ID required" });
  try {
    const existing = await JobApplication.findOne({ job_id: jobId, applicant: req.userId });
    if (existing) return res.status(409).json({ success: false, message: "Already applied to this job" });
    const application = await JobApplication.create({ job_id: jobId, applicant: req.userId, cover_note: coverNote || "" });
    res.status(201).json({ success: true, application });
  } catch (err) {
    console.error("Apply Job Error:", err);
    res.status(500).json({ success: false, message: "Failed to apply" });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const apps = await JobApplication.find({ applicant: req.userId })
      .populate("job_id", "title company location type")
      .sort({ createdAt: -1 });
    res.json(apps.map(a => ({ ...a.toObject(), id: a._id })));
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch applications" });
  }
};

export const getApplicationsForJob = async (req, res) => {
  try {
    const apps = await JobApplication.find({ job_id: req.params.jobId })
      .populate("applicant", "name email college department skills")
      .sort({ createdAt: -1 });
    res.json(apps.map(a => ({ ...a.toObject(), id: a._id })));
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch applications" });
  }
};

export const getApplicationStatus = async (req, res) => {
  try {
    const app = await JobApplication.findOne({ job_id: req.params.jobId, applicant: req.userId });
    res.json({ applied: !!app, status: app?.status || null });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
