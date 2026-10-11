import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import { StoreContext } from "../../context/StoreContext";
import {
  User,
  Save,
  GraduationCap,
  Briefcase,
  Building2,
  Tag,
  Github,
  Linkedin,
  Code,
  Award,
  FileText,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import "./Profile.css";

const Profile = () => {
  const { user, token, setUser, role, axiosAuth } = useContext(StoreContext);
  const [form, setForm] = useState({
    name: "",
    college: "",
    grad_year: "",
    batch: "",
    department: "",
    job_role: "",
    company: "",
    skills: "",
    bio: "",
    github: "",
    leetcode: "",
    linkedin: "",
    resume_url: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        college: user.college || "Graphic Era Hill University",
        grad_year: user.grad_year || user.batch || 2026,
        batch: user.batch || user.grad_year || 2026,
        department: user.department || "Computer Science & Engineering",
        job_role: user.job_role || "",
        company: user.company || "",
        skills: Array.isArray(user.skills) ? user.skills.join(", ") : user.skills || "",
        bio: user.bio || "",
        github: user.github || "",
        leetcode: user.leetcode || "",
        linkedin: user.linkedin || "",
        resume_url: user.resume_url || "",
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axiosAuth().put("/user/profile", {
        ...form,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      });

      if (res.data.success) {
        setUser({ ...user, ...res.data.user });
        toast.success("Verified Profile updated successfully!");
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!user)
    return (
      <div className="profile-page">
        <div className="empty-state">
          <User size={48} />
          <h3>Please login to view profile</h3>
        </div>
      </div>
    );

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-layout">
          {/* Profile Sidebar */}
          <div className="profile-sidebar">
            <div className="profile-avatar">{user.name?.charAt(0)?.toUpperCase()}</div>
            <h2>{user.name}</h2>
            <div style={{ display: "flex", gap: "6px", alignItems: "center", justifyContent: "center" }}>
              <span className={`badge badge-${role === "student" ? "green" : "blue"}`}>{role}</span>
              {user.is_verified && (
                <span className="badge badge-purple" style={{ display: "inline-flex", gap: "2px" }}>
                  <Award size={12} /> Verified
                </span>
              )}
            </div>

            <p className="profile-email">{user.email}</p>

            {user.has_backlog && (
              <div
                style={{
                  background: "#fef2f2",
                  color: "#b91c1c",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  margin: "8px 0",
                }}
              >
                <AlertTriangle size={14} style={{ verticalAlign: "middle", marginRight: "4px" }} />
                Academic Backlog Flagged
              </div>
            )}

            {user.college && (
              <p className="profile-meta">
                <GraduationCap size={14} /> {user.college}
              </p>
            )}
            {user.department && (
              <p className="profile-meta">
                <Building2 size={14} /> {user.department}
              </p>
            )}
            {user.company && (
              <p className="profile-meta">
                <Briefcase size={14} /> {user.company} ({user.job_role || "Alum"})
              </p>
            )}

            {/* Portfolio Badges */}
            <div className="portfolio-links-sidebar">
              {user.github && (
                <a href={user.github} target="_blank" rel="noreferrer" title="GitHub">
                  <Github size={18} />
                </a>
              )}
              {user.leetcode && (
                <a href={user.leetcode} target="_blank" rel="noreferrer" title="LeetCode">
                  <Code size={18} />
                </a>
              )}
              {user.linkedin && (
                <a href={user.linkedin} target="_blank" rel="noreferrer" title="LinkedIn">
                  <Linkedin size={18} />
                </a>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <div className="profile-form-wrap card">
            <div className="profile-form-header">
              <User size={20} />
              <h3>Verified Profile & Portfolio Settings</h3>
            </div>
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label>Full Name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Professional Bio / About Me</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Share a short bio, career interests, and tech passions..."
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>College / University</label>
                  <input
                    className="input"
                    placeholder="Your institution"
                    value={form.college}
                    onChange={(e) => setForm({ ...form, college: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Graduation Batch Year</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="e.g. 2026"
                    value={form.batch}
                    onChange={(e) => setForm({ ...form, batch: e.target.value, grad_year: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Department / Academic Branch</label>
                <input
                  className="input"
                  placeholder="e.g. Computer Science & Engineering"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
              </div>

              {role === "alumni" && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Current Company</label>
                    <input
                      className="input"
                      placeholder="e.g. Google, Microsoft, Amazon"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Current Role Title</label>
                    <input
                      className="input"
                      placeholder="e.g. Senior Software Engineer"
                      value={form.job_role}
                      onChange={(e) => setForm({ ...form, job_role: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Portfolio & Verified Handles */}
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <Github size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> GitHub
                    URL
                  </label>
                  <input
                    className="input"
                    placeholder="https://github.com/username"
                    value={form.github}
                    onChange={(e) => setForm({ ...form, github: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <Code size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> LeetCode
                    Handle / URL
                  </label>
                  <input
                    className="input"
                    placeholder="https://leetcode.com/u/username"
                    value={form.leetcode}
                    onChange={(e) => setForm({ ...form, leetcode: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <Linkedin size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> LinkedIn
                  Profile
                </label>
                <input
                  className="input"
                  placeholder="https://linkedin.com/in/username"
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  <Tag size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Skills (used
                  by AI Matching Engine)
                </label>
                <input
                  className="input"
                  placeholder="e.g. React, Node.js, MongoDB, Docker, Python, Data Structures"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={16} /> {saving ? "Saving Verified Profile..." : "Save Verified Profile"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
