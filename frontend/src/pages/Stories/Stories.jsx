import React, { useState, useEffect, useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import {
  BookOpen,
  Sparkles,
  Heart,
  Bookmark,
  Flag,
  Plus,
  Award,
  Search,
  Building,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import "./Stories.css";

const Stories = () => {
  const { axiosAuth, token, user } = useContext(StoreContext);
  const [stories, setStories] = useState([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [formCategory, setFormCategory] = useState("Career Journey");
  const [company, setCompany] = useState("");

  const fetchStories = async () => {
    try {
      const res = await axiosAuth().get("/stories", {
        params: { category, search },
      });
      if (res.data.success) {
        setStories(res.data.stories);
      }
    } catch {}
  };

  useEffect(() => {
    fetchStories();
  }, [category, search]);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Please sign in to publish");
      return;
    }
    if (!title.trim() || !content.trim()) return;

    try {
      setLoading(true);
      const res = await axiosAuth().post("/stories", {
        title: title.trim(),
        content: content.trim(),
        category: formCategory,
        company: company.trim(),
      });

      if (res.data.success) {
        toast.success("Story published with 3-bullet AI Executive Summary!");
        setShowPublishModal(false);
        setTitle("");
        setContent("");
        setCompany("");
        fetchStories();
      }
    } catch {
      toast.error("Failed to publish story");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (id) => {
    if (!token) {
      toast.error("Please sign in to like");
      return;
    }
    try {
      const res = await axiosAuth().post(`/stories/${id}/like`);
      if (res.data.success) {
        setStories((prev) =>
          prev.map((s) => (s._id === id ? { ...s, likes: res.data.liked ? [...s.likes, user?._id] : s.likes.filter((u) => u !== user?._id) } : s))
        );
      }
    } catch {}
  };

  const handleFlag = async (id) => {
    const reason = prompt("Please provide a reason for flagging this story as spam or inappropriate:");
    if (!reason) return;
    try {
      const res = await axiosAuth().post(`/stories/${id}/flag`, { reason });
      if (res.data.success) {
        toast.success("Story flagged for administrator review");
        fetchStories();
      }
    } catch {
      toast.error("Failed to flag story");
    }
  };

  return (
    <div className="stories-page">
      <div className="stories-header">
        <div>
          <div className="badge-ai">
            <Sparkles size={16} /> 3-Bullet AI Executive Summaries • Gemini 1.5 Flash
          </div>
          <h1>Alumni Stories & Verified Career Journeys</h1>
          <p>Read firsthand college-to-corporate journeys, company interview walkthroughs, and executive takeaways.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowPublishModal(true)}>
          <Plus size={18} /> Share Your Journey
        </button>
      </div>

      <div className="stories-filter-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search stories by company, role, keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="category-chips">
          {["all", "Career Journey", "Interview Experience", "Higher Studies", "Startup", "Campus Life"].map((cat) => (
            <button
              key={cat}
              className={`cat-chip ${category === cat ? "active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="stories-grid">
        {stories.map((story) => (
          <div key={story._id} className="story-card">
            <div className="story-top">
              <span className="story-category">{story.category}</span>
              {story.company && (
                <span className="story-company">
                  <Building size={13} /> {story.company}
                </span>
              )}
            </div>

            <h2>{story.title}</h2>

            <div className="story-author-line">
              <User size={14} />
              <span>{story.author?.name}</span>
              {story.is_verified && (
                <span className="badge-verified">
                  <Award size={12} /> Verified Alum
                </span>
              )}
            </div>

            {/* 3-Bullet AI Executive Summary */}
            {story.ai_summary && story.ai_summary.length > 0 && (
              <div className="ai-summary-pill-box">
                <div className="ai-sum-title">
                  <Sparkles size={14} color="#7c3aed" /> 3-Bullet AI Executive Summary:
                </div>
                <ul>
                  {story.ai_summary.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="story-body-text">{story.content}</p>

            <div className="story-card-footer">
              <div className="card-reactions">
                <button
                  className={`btn-icon ${story.likes?.includes(user?._id) ? "liked" : ""}`}
                  onClick={() => handleLike(story._id)}
                >
                  <Heart size={16} /> <span>{story.likes?.length || 0}</span>
                </button>
                <button className="btn-icon" onClick={() => handleFlag(story._id)} title="Flag spam or inappropriate">
                  <Flag size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="modal-overlay" onClick={() => setShowPublishModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Publish Alumni Story & Experience</h2>
            <p>Our AI will generate an executive 3-bullet takeaway summary upon submission.</p>
            <form onSubmit={handlePublish}>
              <div className="form-group">
                <label>Story Title</label>
                <input
                  type="text"
                  placeholder="e.g. From College Lab to Senior SDE at Microsoft: My Roadmap"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label>Category</label>
                  <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                    <option value="Career Journey">Career Journey</option>
                    <option value="Interview Experience">Interview Experience</option>
                    <option value="Higher Studies">Higher Studies</option>
                    <option value="Startup">Startup</option>
                    <option value="Campus Life">Campus Life</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Associated Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Google, Amazon, Microsoft"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Full Experience / Story Content</label>
                <textarea
                  rows={8}
                  placeholder="Share details about interview rounds, preparation strategies, pivotal challenges overcome..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowPublishModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Generating AI Summary..." : "Publish Story"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stories;
