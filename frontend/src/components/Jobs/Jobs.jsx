import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import config from "../../config";
import { StoreContext } from "../../context/StoreContext";
import {
  Search,
  Briefcase,
  MapPin,
  Building2,
  Clock,
  Plus,
  X,
  CheckCircle,
  FileText,
  Sparkles,
  Award,
  Send,
  UserCheck,
  Trophy,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import "./Jobs.css";

const JOB_TYPES = ["all", "Full-time", "Part-time", "Internship", "Contract"];

const ApplyModal = ({ job, token, onClose, onApplied }) => {
  const [coverNote, setCoverNote] = useState("");
  const [resumeLink, setResumeLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(
        `${config.API_URL}/jobs/apply`,
        { jobId: job._id || job.id, coverNote, resumeLink },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Referral requested for ${job.title}!`);
      onApplied(job._id || job.id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="apply-modal card" onClick={(e) => e.stopPropagation()}>
        <div className="apply-modal-header">
          <div>
            <h3>Request Referral for {job.title}</h3>
            <p>
              {job.company} · {job.location}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleApply}>
          <div className="form-group">
            <label>Why are you a great candidate for this role?</label>
            <textarea
              className="input"
              rows={4}
              placeholder="Highlight your relevant projects, tech stack, and why the alumnus should refer you..."
              value={coverNote}
              onChange={(e) => setCoverNote(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Link to Resume / Portfolio (Google Drive or GitHub)</label>
            <input
              type="url"
              className="input"
              placeholder="https://drive.google.com/your-resume.pdf"
              value={resumeLink}
              onChange={(e) => setResumeLink(e.target.value)}
            />
          </div>
          <div className="apply-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Sending Request..." : "Submit 1-Click Referral Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const JobCard = ({ job, onApply, applied, isAiMatchView }) => (
  <div className="job-card card">
    <div className="job-header">
      <div className="job-company-avatar">{(job.company || "C").charAt(0)}</div>
      <div>
        <h3 className="job-title">{job.title}</h3>
        <div className="job-meta">
          <span>
            <Building2 size={12} /> {job.company}
          </span>
          <span>
            <MapPin size={12} /> {job.location}
          </span>
        </div>
      </div>
    </div>

    {/* AI Semantic Compatibility Banner */}
    {job.ai_match && (
      <div className="ai-match-card-banner">
        <div className="ai-match-score-row">
          <span className="match-score-badge">
            <Sparkles size={13} /> {job.ai_match.match_score}% Semantic Fit
          </span>
          {job.is_eligible !== undefined && (
            <span className={`eligibility-badge ${job.is_eligible ? "eligible" : "ineligible"}`}>
              {job.is_eligible ? "✓ Academically Eligible" : "⚠️ Batch/Dept Restricted"}
            </span>
          )}
        </div>

        {job.ai_match.matched_skills?.length > 0 && (
          <div className="skills-line">
            <span className="label">Matched:</span>
            {job.ai_match.matched_skills.map((s, i) => (
              <span key={i} className="skill-mini-pill matched">
                {s}
              </span>
            ))}
          </div>
        )}

        {job.ai_match.missing_skills?.length > 0 && (
          <div className="skills-line">
            <span className="label">Missing:</span>
            {job.ai_match.missing_skills.map((s, i) => (
              <span key={i} className="skill-mini-pill missing">
                {s}
              </span>
            ))}
          </div>
        )}

        {job.ai_match.ai_tips && <p className="ai-match-tip">💡 {job.ai_match.ai_tips}</p>}
      </div>
    )}

    <div className="job-badges">
      <span className={`badge badge-${job.type === "Internship" ? "amber" : "blue"}`}>{job.type}</span>
      {job.salary_range && <span className="badge badge-green">{job.salary_range}</span>}
      {job.referral_available && <span className="badge badge-purple">⚡ Referral Open</span>}
    </div>

    {job.description && <p className="job-desc">{job.description.substring(0, 140)}...</p>}
    {job.users && (
      <p className="job-posted-by">
        Posted by <strong>{job.users.name}</strong> ({job.users.company || "Alumni"})
      </p>
    )}

    <div className="job-footer">
      <span className="job-time">
        <Clock size={12} /> {new Date(job.createdAt || job.created_at || Date.now()).toLocaleDateString()}
      </span>
      {applied ? (
        <span className="applied-badge">
          <CheckCircle size={13} /> Requested
        </span>
      ) : (
        <button className="btn btn-primary btn-sm" onClick={() => onApply(job)}>
          <FileText size={13} /> 1-Click Referral
        </button>
      )}
    </div>
  </div>
);

const Jobs = () => {
  const { role, token, setShowLogin, axiosAuth } = useContext(StoreContext);
  const [viewTab, setViewTab] = useState("all"); // "all" | "semantic" | "tracker" | "review" | "leaderboard"
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applyingJob, setApplyingJob] = useState(null);
  const [appliedIds, setAppliedIds] = useState(new Set());

  // Tracker & Review state
  const [myApplications, setMyApplications] = useState([]);
  const [alumniReviewApps, setAlumniReviewApps] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [reviewNote, setReviewNote] = useState({});

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    type: "Full-time",
    description: "",
    salary_range: "",
    requirements: "",
    skills_required: "",
    eligible_batches: "2025, 2026, 2027",
    eligible_departments: "Computer Science & Engineering, Information Technology",
  });

  const fetchJobs = async () => {
    try {
      setLoading(true);
      if (viewTab === "semantic" && token) {
        const res = await axiosAuth().get("/jobs/semantic-matches");
        if (res.data.success) {
          setJobs(res.data.jobs);
        }
      } else {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (typeFilter !== "all") params.set("type", typeFilter);
        const res = await axios.get(`${config.API_URL}/jobs?${params}`);
        setJobs(res.data);
      }
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackerData = async () => {
    if (!token) return;
    try {
      const res = await axiosAuth().get("/jobs/my-applications");
      setMyApplications(res.data);
      const ids = new Set(res.data.map((a) => a.job_id?._id || a.job_id));
      setAppliedIds(ids);
    } catch {}
  };

  const fetchAlumniReviewData = async () => {
    if (!token) return;
    try {
      const res = await axiosAuth().get("/jobs/alumni-referrals");
      setAlumniReviewApps(res.data);
    } catch {}
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get(`${config.API_URL}/jobs/leaderboard`);
      if (res.data.success) setLeaderboard(res.data.leaderboard);
    } catch {}
  };

  useEffect(() => {
    if (viewTab === "tracker") fetchTrackerData();
    else if (viewTab === "review") fetchAlumniReviewData();
    else if (viewTab === "leaderboard") fetchLeaderboard();
    else fetchJobs();
  }, [search, typeFilter, viewTab]);

  useEffect(() => {
    if (token) fetchTrackerData();
  }, [token]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Please login first");
      return;
    }
    setSubmitting(true);
    try {
      await axiosAuth().post("/jobs", form);
      toast.success("Job and referral pipeline posted successfully!");
      setShowForm(false);
      setForm({
        title: "",
        company: "",
        location: "",
        type: "Full-time",
        description: "",
        salary_range: "",
        requirements: "",
        skills_required: "",
        eligible_batches: "2025, 2026, 2027",
        eligible_departments: "Computer Science & Engineering, Information Technology",
      });
      fetchJobs();
    } catch {
      toast.error("Failed to post job");
    } finally {
      setSubmitting(false);
    }
  };

  // 1-Click Referral Grant / Decline
  const handleUpdateReferral = async (applicationId, newStatus) => {
    try {
      const notes = reviewNote[applicationId] || "";
      const res = await axiosAuth().patch(`/jobs/applications/${applicationId}/referral`, {
        status: newStatus,
        alumniNotes: notes,
      });
      if (res.data.success) {
        toast.success(`Referral request ${newStatus}!`);
        fetchAlumniReviewData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handleApply = (job) => {
    if (!token) {
      setShowLogin(true);
      return;
    }
    setApplyingJob(job);
  };

  const onApplied = (jobId) => {
    setAppliedIds((prev) => new Set([...prev, jobId]));
    fetchTrackerData();
  };

  return (
    <div className="jobs-wrapper">
      {applyingJob && (
        <ApplyModal job={applyingJob} token={token} onClose={() => setApplyingJob(null)} onApplied={onApplied} />
      )}

      {/* Main Top Navigation Modes */}
      <div className="jobs-view-modes">
        <button className={viewTab === "all" ? "active" : ""} onClick={() => setViewTab("all")}>
          <Briefcase size={16} /> All Job Openings
        </button>
        {token && (
          <button className={viewTab === "semantic" ? "active" : ""} onClick={() => setViewTab("semantic")}>
            <Sparkles size={16} /> AI Semantic Matches (Module 3)
          </button>
        )}
        {token && (
          <button className={viewTab === "tracker" ? "active" : ""} onClick={() => setViewTab("tracker")}>
            <FileText size={16} /> My Referrals Tracker ({myApplications.length})
          </button>
        )}
        {(role === "alumni" || role === "admin" || role === "master_admin") && (
          <button className={viewTab === "review" ? "active" : ""} onClick={() => setViewTab("review")}>
            <UserCheck size={16} /> Review Applicants ({alumniReviewApps.length})
          </button>
        )}
        <button className={viewTab === "leaderboard" ? "active" : ""} onClick={() => setViewTab("leaderboard")}>
          <Trophy size={16} /> Alumni Leaderboard
        </button>
      </div>

      {(viewTab === "all" || viewTab === "semantic") && (
        <div className="jobs-controls">
          <div className="search-bar">
            <Search size={16} />
            <input placeholder="Search jobs, skills, company..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="type-filters">
            {JOB_TYPES.map((t) => (
              <button
                key={t}
                className={`btn btn-sm ${typeFilter === t ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setTypeFilter(t)}
              >
                {t === "all" ? "All Types" : t}
              </button>
            ))}
          </div>
          {(role === "alumni" || role === "admin" || role === "master_admin") && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
              {showForm ? <X size={14} /> : <Plus size={14} />}
              {showForm ? "Cancel" : "Post Opportunity"}
            </button>
          )}
        </div>
      )}

      {/* Post Opportunity Form */}
      {showForm && (
        <div className="job-form card">
          <h3>Post a Verified Opportunity & Referral Opening</h3>
          <form onSubmit={handlePost} className="job-form-grid">
            <div className="form-group">
              <label>Job Title *</label>
              <input
                className="input"
                placeholder="e.g. SDE-1 / Frontend Engineer"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Company *</label>
              <input
                className="input"
                placeholder="e.g. Microsoft, Google, Swiggy"
                required
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Location *</label>
              <input
                className="input"
                placeholder="e.g. Bangalore, Hyderabad, Remote"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Job Type *</label>
              <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Internship</option>
                <option>Contract</option>
              </select>
            </div>
            <div className="form-group">
              <label>Salary / CTC Range</label>
              <input
                className="input"
                placeholder="e.g. ₹12-18 LPA"
                value={form.salary_range}
                onChange={(e) => setForm({ ...form, salary_range: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Key Skills Required (comma separated)</label>
              <input
                className="input"
                placeholder="e.g. React, Node.js, MongoDB, Docker, DSA"
                value={form.skills_required}
                onChange={(e) => setForm({ ...form, skills_required: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Eligible Batches (comma separated)</label>
              <input
                className="input"
                placeholder="e.g. 2025, 2026, 2027"
                value={form.eligible_batches}
                onChange={(e) => setForm({ ...form, eligible_batches: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Eligible Departments</label>
              <input
                className="input"
                placeholder="e.g. Computer Science, Information Technology"
                value={form.eligible_departments}
                onChange={(e) => setForm({ ...form, eligible_departments: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ gridColumn: "1/-1" }}>
              <label>Job Description *</label>
              <textarea
                className="textarea"
                placeholder="Describe role, team, and day-to-day responsibilities..."
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Publishing..." : "Publish Job with Referral Pipeline"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mode 1 & 2: Job Openings & AI Semantic Matches */}
      {(viewTab === "all" || viewTab === "semantic") && (
        <>
          {loading ? (
            <div className="jobs-grid">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="card" style={{ padding: 24 }}>
                    <div className="skeleton" style={{ height: 60, marginBottom: 12 }} />
                    <div className="skeleton" style={{ height: 16, marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 14, width: "60%" }} />
                  </div>
                ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <Briefcase size={48} />
              <h3>No jobs found</h3>
              <p>Try different search filters or add your skills to view AI semantic matches.</p>
            </div>
          ) : (
            <div className="jobs-grid">
              {jobs.map((job) => (
                <JobCard
                  key={job._id || job.id}
                  job={job}
                  onApply={handleApply}
                  applied={appliedIds.has(job._id || job.id)}
                  isAiMatchView={viewTab === "semantic"}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Mode 3: Student Referral Status Tracker */}
      {viewTab === "tracker" && (
        <div className="referral-tracker-view">
          <h2>Student Referral Status Tracker</h2>
          <p>Real-time applicant tracking pipeline with feedback notes from verified alumni referrers.</p>
          {myApplications.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <h3>No Referral Requests Yet</h3>
              <p>Explore open positions in "All Job Openings" and click 1-Click Referral to apply!</p>
            </div>
          ) : (
            <div className="tracker-table-wrap">
              <table className="tracker-table">
                <thead>
                  <tr>
                    <th>Role & Company</th>
                    <th>Status</th>
                    <th>Alumni Notes / Feedback</th>
                    <th>Date Requested</th>
                  </tr>
                </thead>
                <tbody>
                  {myApplications.map((app) => (
                    <tr key={app._id || app.id}>
                      <td>
                        <strong>{app.job_id?.title}</strong>
                        <div className="sub-text">
                          {app.job_id?.company} · {app.job_id?.location}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge-status status-${(app.status || "Pending").toLowerCase()}`}
                        >
                          {app.status || "Pending"}
                        </span>
                      </td>
                      <td>{app.alumni_notes || <em>No feedback provided yet</em>}</td>
                      <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Mode 4: Alumni Review Dashboard */}
      {viewTab === "review" && (
        <div className="alumni-review-view">
          <h2>In-App Applicant Review Dashboard</h2>
          <p>Review students requesting referrals for your posted roles and grant or decline with 1 click.</p>
          {alumniReviewApps.length === 0 ? (
            <div className="empty-state">
              <UserCheck size={48} />
              <h3>No Pending Applicants</h3>
              <p>You currently do not have any pending referral requests for your jobs.</p>
            </div>
          ) : (
            <div className="applicant-cards-grid">
              {alumniReviewApps.map((app) => (
                <div key={app._id} className="applicant-review-card card">
                  <div className="app-card-top">
                    <div>
                      <h4>{app.applicant?.name}</h4>
                      <div className="sub-text">
                        {app.applicant?.department} · Batch {app.applicant?.batch}
                      </div>
                    </div>
                    <span className={`badge-status status-${(app.status || "Pending").toLowerCase()}`}>
                      {app.status}
                    </span>
                  </div>

                  <div className="app-job-target">
                    Applied For: <strong>{app.job_id?.title}</strong> at {app.job_id?.company}
                  </div>

                  {app.applicant?.skills?.length > 0 && (
                    <div className="app-skills">
                      {app.applicant.skills.map((s, i) => (
                        <span key={i} className="skill-pill">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="app-note-box">
                    <strong>Applicant Note:</strong>
                    <p>{app.cover_note || "No cover note provided."}</p>
                    {app.resume_link && (
                      <a href={app.resume_link} target="_blank" rel="noreferrer" className="resume-link">
                        📄 View Attached Resume
                      </a>
                    )}
                  </div>

                  <div className="alumni-action-box">
                    <input
                      type="text"
                      placeholder="Add custom referral note / feedback..."
                      value={reviewNote[app._id] || ""}
                      onChange={(e) => setReviewNote({ ...reviewNote, [app._id]: e.target.value })}
                    />
                    <div className="action-btns">
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleUpdateReferral(app._id, "Granted")}
                      >
                        ✓ Grant Referral
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleUpdateReferral(app._id, "Declined")}
                      >
                        ✕ Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mode 5: Alumni Referral Leaderboard */}
      {viewTab === "leaderboard" && (
        <div className="leaderboard-view">
          <h2>🏆 Top Alumni Referral Leaderboard</h2>
          <p>Recognizing the alumni champions bridging the academia-to-industry gap.</p>
          <div className="leaderboard-table-wrap">
            <table className="tracker-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Alumnus</th>
                  <th>Company & Role</th>
                  <th>Department</th>
                  <th>Referrals Granted</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((alumnus, idx) => (
                  <tr key={alumnus._id}>
                    <td>
                      <span className={`rank-badge rank-${idx + 1}`}>#{idx + 1}</span>
                    </td>
                    <td>
                      <strong>{alumnus.name}</strong>
                    </td>
                    <td>
                      {alumnus.company || "Leading Tech Corp"} ({alumnus.job_role || "Alum"})
                    </td>
                    <td>{alumnus.department}</td>
                    <td>
                      <strong style={{ color: "#2563eb", fontSize: "1.1rem" }}>
                        {alumnus.referrals_granted || Math.max(1, 5 - idx)}
                      </strong>{" "}
                      granted
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
