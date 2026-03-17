import { useState, useEffect, useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import config from "../../config";
import { BookOpen, Plus, X, Heart, Trash2, Search, Link, FileText, Video, File, Tag, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import "./Resources.css";

const TYPE_ICONS = { notes: FileText, link: Link, pdf: File, video: Video, other: File };
const TYPE_COLORS = { notes: "blue", link: "green", pdf: "red", video: "amber", other: "gray" };
const TYPES = ["all", "notes", "link", "pdf", "video", "other"];

const ResourceCard = ({ resource, onLike, onDelete, myId }) => {
  const Icon = TYPE_ICONS[resource.type] || File;
  const isOwner = (resource.posted_by?._id || resource.posted_by) === myId;
  const liked = (resource.likes || []).some(l => l?.toString() === myId?.toString());

  return (
    <div className="resource-card card">
      <div className="rc-header">
        <div className={`rc-type-icon type-${TYPE_COLORS[resource.type]}`}><Icon size={18} /></div>
        <span className={`badge badge-${TYPE_COLORS[resource.type] || "blue"}`}>{resource.type}</span>
        {isOwner && (
          <button className="btn btn-ghost btn-sm rc-delete" onClick={() => onDelete(resource.id || resource._id)}>
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <h3 className="rc-title">{resource.title}</h3>
      {resource.subject && <div className="rc-subject"><Tag size={12} /> {resource.subject}</div>}
      {resource.description && <p className="rc-desc">{resource.description}</p>}

      {resource.type === "notes" ? (
        <div className="rc-content-box">{resource.content}</div>
      ) : (
        <a href={resource.content} target="_blank" rel="noopener noreferrer" className="rc-link-btn">
          <ExternalLink size={14} /> Open Resource
        </a>
      )}

      {resource.tags?.length > 0 && (
        <div className="rc-tags">
          {resource.tags.map((t, i) => <span key={i} className="rc-tag">#{t}</span>)}
        </div>
      )}

      <div className="rc-footer">
        <div className="rc-author">
          <div className="rc-avatar">{resource.posted_by?.name?.charAt(0) || "A"}</div>
          <div>
            <div className="rc-author-name">{resource.posted_by?.name || "Alumni"}</div>
            <div className="rc-author-role">{resource.posted_by?.college || resource.posted_by?.role}</div>
          </div>
        </div>
        <button className={`rc-like-btn ${liked ? "liked" : ""}`} onClick={() => onLike(resource.id || resource._id)}>
          <Heart size={14} fill={liked ? "#ef4444" : "none"} />
          <span>{resource.likes?.length || 0}</span>
        </button>
      </div>
    </div>
  );
};

const Resources = () => {
  const { token, role, user } = useContext(StoreContext);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "notes", content: "", tags: "", subject: "" });

  const fetchResources = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter !== "all") params.set("type", typeFilter);
      const r = await axios.get(`${config.API_URL}/resources?${params}`);
      setResources(r.data);
    } catch { toast.error("Failed to load resources"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchResources(); }, [search, typeFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${config.API_URL}/resources/create`, form, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Resource posted!");
      setShowForm(false);
      setForm({ title: "", description: "", type: "notes", content: "", tags: "", subject: "" });
      fetchResources();
    } catch { toast.error("Failed to post resource"); }
    finally { setSubmitting(false); }
  };

  const handleLike = async (id) => {
    if (!token) { toast.error("Login to like resources"); return; }
    try {
      const r = await axios.post(`${config.API_URL}/resources/${id}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setResources(prev => prev.map(res =>
        (res.id || res._id) === id
          ? { ...res, likes: r.data.liked ? [...(res.likes || []), user?.id] : (res.likes || []).filter(l => l?.toString() !== (user?.id || user?._id)?.toString()) }
          : res
      ));
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${config.API_URL}/resources/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setResources(prev => prev.filter(r => (r.id || r._id) !== id));
      toast.success("Deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const myId = user?.id || user?._id;

  return (
    <div className="resources-page">
      <div className="resources-hero">
        <div className="container">
          <div className="rh-badge"><BookOpen size={14} /> Resources Library</div>
          <h1>Alumni Knowledge Hub</h1>
          <p>Notes, guides, links & videos shared by alumni to help you succeed</p>
          {role === "alumni" && (
            <button className="btn btn-primary btn-lg" onClick={() => setShowForm(true)}>
              <Plus size={18} /> Share a Resource
            </button>
          )}
        </div>
      </div>

      <div className="container resources-body">
        {/* Post form */}
        {showForm && role === "alumni" && (
          <div className="resource-form-card card">
            <div className="rfc-header">
              <h3>Share a Resource</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="rfc-form">
              <div className="rfc-row">
                <input className="input" placeholder="Title *" required value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} />
                <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="notes">📝 Notes</option>
                  <option value="link">🔗 Link</option>
                  <option value="pdf">📄 PDF URL</option>
                  <option value="video">🎥 Video</option>
                  <option value="other">📦 Other</option>
                </select>
              </div>
              <input className="input" placeholder="Subject (e.g. Data Structures, DBMS...)" value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })} />
              <input className="input" placeholder="Description" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
              <textarea className="input" rows={form.type === "notes" ? 6 : 2}
                placeholder={form.type === "notes" ? "Paste your notes here..." : "Paste URL here..."}
                required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
              <input className="input" placeholder="Tags (comma separated): dsa, placement, react..."
                value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Posting..." : "Post Resource"}
              </button>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="resources-filters">
          <div className="search-bar">
            <Search size={16} />
            <input placeholder="Search resources, tags, subjects..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="type-filters">
            {TYPES.map(t => (
              <button key={t} className={`btn btn-sm ${typeFilter === t ? "btn-primary" : "btn-outline"}`}
                onClick={() => setTypeFilter(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="resources-grid">{Array(6).fill(0).map((_, i) => (
            <div key={i} className="resource-card card">
              <div className="skeleton" style={{ height: 140 }} />
            </div>
          ))}</div>
        ) : resources.length === 0 ? (
          <div className="empty-state"><BookOpen size={48} /><h3>No resources yet</h3>
            {role === "alumni" && <p>Be the first to share your knowledge!</p>}
          </div>
        ) : (
          <div className="resources-grid">
            {resources.map(r => (
              <ResourceCard key={r.id || r._id} resource={r} onLike={handleLike} onDelete={handleDelete} myId={myId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Resources;
