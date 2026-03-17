import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import config from "../../config";
import { StoreContext } from "../../context/StoreContext";
import { Search, Briefcase, MapPin, Building2, Clock, Plus, X, CheckCircle, FileText } from "lucide-react";
import toast from "react-hot-toast";
import "./Jobs.css";

const JOB_TYPES = ["all", "Full-time", "Part-time", "Internship", "Contract"];

const ApplyModal = ({ job, token, onClose, onApplied }) => {
  const [coverNote, setCoverNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${config.API_URL}/jobs/apply`,
        { jobId: job._id || job.id, coverNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Successfully applied to ${job.title}!`);
      onApplied(job._id || job.id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to apply");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="apply-modal card" onClick={e => e.stopPropagation()}>
        <div className="apply-modal-header">
          <div>
            <h3>Apply to {job.title}</h3>
            <p>{job.company} · {job.location}</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleApply}>
          <div className="form-group">
            <label>Cover Note <span style={{fontWeight:400,color:'var(--text-secondary)'}}>(optional)</span></label>
            <textarea className="input" rows={4}
              placeholder="Tell the recruiter why you're a great fit..."
              value={coverNote} onChange={e => setCoverNote(e.target.value)} />
          </div>
          <div className="apply-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const JobCard = ({ job, onApply, applied }) => (
  <div className="job-card card">
    <div className="job-header">
      <div className="job-company-avatar">{(job.company || 'C').charAt(0)}</div>
      <div>
        <h3 className="job-title">{job.title}</h3>
        <div className="job-meta">
          <span><Building2 size={12} /> {job.company}</span>
          <span><MapPin size={12} /> {job.location}</span>
        </div>
      </div>
    </div>
    <div className="job-badges">
      <span className={`badge badge-${job.type === 'Internship' ? 'amber' : 'blue'}`}>{job.type}</span>
      {job.salary_range && <span className="badge badge-green">{job.salary_range}</span>}
    </div>
    {job.description && <p className="job-desc">{job.description.substring(0, 120)}...</p>}
    {job.users && <p className="job-posted-by">Posted by <strong>{job.users.name}</strong></p>}
    <div className="job-footer">
      <span className="job-time"><Clock size={12} /> {new Date(job.createdAt || job.createdAt || job.created_at).toLocaleDateString()}</span>
      {applied ? (
        <span className="applied-badge"><CheckCircle size={13} /> Applied</span>
      ) : (
        <button className="btn btn-primary btn-sm" onClick={() => onApply(job)}>
          <FileText size={13} /> Apply Now
        </button>
      )}
    </div>
  </div>
);

const Jobs = () => {
  const { role, token, setShowLogin } = useContext(StoreContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applyingJob, setApplyingJob] = useState(null);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [form, setForm] = useState({ title: '', company: '', location: '', type: 'Full-time', description: '', salary_range: '', requirements: '' });

  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const res = await axios.get(`${config.API_URL}/jobs?${params}`);
      setJobs(res.data);
    } catch { toast.error("Failed to load jobs"); }
    finally { setLoading(false); }
  };

  // Load user's existing applications
  useEffect(() => {
    if (!token) return;
    axios.get(`${config.API_URL}/jobs/my-applications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        const ids = new Set(r.data.map(a => a.job_id?._id || a.job_id));
        setAppliedIds(ids);
      }).catch(() => {});
  }, [token]);

  useEffect(() => { fetchJobs(); }, [search, typeFilter]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!token) { toast.error("Please login first"); return; }
    setSubmitting(true);
    try {
      await axios.post(`${config.API_URL}/jobs/create`, form, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Job posted successfully!");
      setShowForm(false);
      setForm({ title: '', company: '', location: '', type: 'Full-time', description: '', salary_range: '', requirements: '' });
      fetchJobs();
    } catch { toast.error("Failed to post job"); }
    finally { setSubmitting(false); }
  };

  const handleApply = (job) => {
    if (!token) { setShowLogin(true); return; }
    setApplyingJob(job);
  };

  const onApplied = (jobId) => setAppliedIds(prev => new Set([...prev, jobId]));

  return (
    <div className="jobs-wrapper">
      {applyingJob && (
        <ApplyModal job={applyingJob} token={token} onClose={() => setApplyingJob(null)} onApplied={onApplied} />
      )}

      <div className="jobs-controls">
        <div className="search-bar">
          <Search size={16} />
          <input placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="type-filters">
          {JOB_TYPES.map(t => (
            <button key={t} className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTypeFilter(t)}>
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>
        {role === 'alumni' && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? "Cancel" : "Post Job"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="job-form card">
          <h3>Post a Job Opening</h3>
          <form onSubmit={handlePost} className="job-form-grid">
            <div className="form-group">
              <label>Job Title *</label>
              <input className="input" placeholder="e.g. Software Engineer" required
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Company *</label>
              <input className="input" placeholder="Company name" required
                value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Location *</label>
              <input className="input" placeholder="e.g. Bangalore, Remote" required
                value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Job Type *</label>
              <select className="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option>Full-time</option><option>Part-time</option>
                <option>Internship</option><option>Contract</option>
              </select>
            </div>
            <div className="form-group">
              <label>Salary Range</label>
              <input className="input" placeholder="e.g. ₹8-12 LPA" value={form.salary_range}
                onChange={e => setForm({ ...form, salary_range: e.target.value })} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Description *</label>
              <textarea className="textarea" placeholder="Describe the role and responsibilities..." required
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Requirements</label>
              <textarea className="textarea" placeholder="Skills and qualifications needed..."
                value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Posting..." : "Submit Job"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="jobs-grid">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card" style={{ padding: 24 }}>
              <div className="skeleton" style={{ height: 60, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 16, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 14, width: '60%' }} />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <Briefcase size={48} />
          <h3>No jobs found</h3>
          <p>Try different filters or check back later</p>
        </div>
      ) : (
        <div className="jobs-grid">
          {jobs.map(job => (
            <JobCard
              key={job._id || job.id}
              job={job}
              onApply={handleApply}
              applied={appliedIds.has(job._id || job.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Jobs;
