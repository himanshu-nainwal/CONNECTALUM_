import { useState, useEffect, useContext, useCallback } from "react";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import config from "../../config";
import { Users, Plus, X, Heart, Send, Lock, Globe, Search, ArrowLeft, MessageSquare, Crown } from "lucide-react";
import toast from "react-hot-toast";
import "./Communities.css";

const Communities = () => {
  const { token, role, user } = useContext(StoreContext);
  const [communities, setCommunities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [postText, setPostText] = useState("");
  const [posting, setPosting] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", topic: "", is_private: false });
  const myId = user?.id?.toString() || user?._id?.toString();

  const fetchCommunities = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const r = await axios.get(`${config.API_URL}/communities?${params}`);
      setCommunities(r.data);
    } catch { toast.error("Failed to load communities"); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchCommunities(); }, [fetchCommunities]);

  const openCommunity = async (communityId) => {
    try {
      const r = await axios.get(`${config.API_URL}/communities/${communityId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSelected(r.data);
    } catch { toast.error("Failed to load community"); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${config.API_URL}/communities/create`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Community created!");
      setShowForm(false);
      setForm({ name: "", description: "", topic: "", is_private: false });
      fetchCommunities();
    } catch { toast.error("Failed to create community"); }
    finally { setSubmitting(false); }
  };

  const toggleJoin = async (communityId) => {
    if (!token) { toast.error("Login required"); return; }
    try {
      const r = await axios.post(`${config.API_URL}/communities/${communityId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(r.data.joined ? "Joined community!" : "Left community");
      fetchCommunities();
      if (selected) openCommunity(selected._id || selected.id);
    } catch { toast.error("Failed"); }
  };

  const handlePost = async () => {
    if (!postText.trim() || !selected) return;
    setPosting(true);
    const communityId = selected._id || selected.id;
    try {
      const r = await axios.post(
        `${config.API_URL}/communities/${communityId}/post`,
        { text: postText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelected((prev) => ({ ...prev, posts: [...(prev.posts || []), r.data.post] }));
      setPostText("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post");
    } finally { setPosting(false); }
  };

  const handleLikePost = async (postId) => {
    if (!token) { toast.error("Login required"); return; }
    const communityId = selected?._id || selected?.id;
    try {
      const r = await axios.post(
        `${config.API_URL}/communities/${communityId}/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelected((prev) => ({
        ...prev,
        posts: prev.posts.map((p) =>
          (p._id || p.id)?.toString() === postId?.toString()
            ? { ...p, likes: r.data.liked ? [...(p.likes || []), myId] : (p.likes || []).filter((l) => l?.toString() !== myId) }
            : p
        ),
      }));
    } catch {}
  };

  // Robust membership check — members can be ObjectId objects or strings
  const isMember = (c) => {
    if (!myId || !c?.members) return false;
    return c.members.some((m) => {
      const mStr = m?._id?.toString() || m?.toString();
      return mStr === myId;
    });
  };

  return (
    <div className="communities-page">
      {!selected ? (
        <>
          <div className="communities-hero">
            <div className="container">
              <div className="ch-badge"><Users size={14} /> Communities</div>
              <h1>Learn Together, Grow Together</h1>
              <p>Alumni-led communities on topics that matter — join discussions, ask questions, share knowledge</p>
              {role === "alumni" && (
                <button className="btn btn-primary btn-lg" onClick={() => setShowForm(true)}>
                  <Plus size={18} /> Create Community
                </button>
              )}
            </div>
          </div>

          <div className="container communities-body">
            {showForm && role === "alumni" && (
              <div className="community-form-card card">
                <div className="cfc-header">
                  <h3>Create a Community</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}><X size={18} /></button>
                </div>
                <form onSubmit={handleCreate} className="cfc-form">
                  <input className="input" placeholder="Community name *" required value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <input className="input" placeholder="Topic (e.g. Web Dev, DSA, ML...)" value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })} />
                  <textarea className="input" rows={3} placeholder="Description (optional)" value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  <label className="privacy-toggle">
                    <input type="checkbox" checked={form.is_private}
                      onChange={(e) => setForm({ ...form, is_private: e.target.checked })} />
                    <span>{form.is_private ? <><Lock size={14} /> Private</> : <><Globe size={14} /> Public</>}</span>
                  </label>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? "Creating…" : "Create Community"}
                  </button>
                </form>
              </div>
            )}

            <div className="communities-search">
              <div className="search-bar">
                <Search size={16} />
                <input placeholder="Search communities by name or topic..." value={search}
                  onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            {loading ? (
              <div className="communities-grid">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="community-card card"><div className="skeleton" style={{ height: 120 }} /></div>
                ))}
              </div>
            ) : communities.length === 0 ? (
              <div className="empty-state">
                <Users size={48} /><h3>No communities yet</h3>
                {role === "alumni" && <p>Create the first one!</p>}
              </div>
            ) : (
              <div className="communities-grid">
                {communities.map((c) => {
                  const joined = isMember(c);
                  return (
                    <div key={c.id || c._id} className="community-card card">
                      <div className="cc-header">
                        <div className="cc-icon">{c.name.charAt(0).toUpperCase()}</div>
                        <div className="cc-privacy">{c.is_private ? <Lock size={12} /> : <Globe size={12} />}</div>
                      </div>
                      <h3 className="cc-name">{c.name}</h3>
                      {c.topic && <div className="cc-topic">{c.topic}</div>}
                      {c.description && <p className="cc-desc">{c.description}</p>}
                      <div className="cc-meta">
                        <span><Users size={12} /> {c.memberCount ?? c.members?.length ?? 0} members</span>
                        <span><MessageSquare size={12} /> {c.postCount ?? c.posts?.length ?? 0} posts</span>
                      </div>
                      {c.created_by && (
                        <div className="cc-creator"><Crown size={11} /> {c.created_by?.name || "Alumni"}</div>
                      )}
                      <div className="cc-actions">
                        <button className="btn btn-sm btn-outline" onClick={() => openCommunity(c.id || c._id)}>View</button>
                        <button className={`btn btn-sm ${joined ? "btn-outline" : "btn-primary"}`}
                          onClick={() => toggleJoin(c.id || c._id)}>
                          {joined ? "Leave" : "Join"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* ── Community Detail ── */
        <div className="community-detail">
          <div className="cd-header">
            <div className="container cd-header-inner">
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>
                <ArrowLeft size={18} /> All Communities
              </button>
              <div className="cd-info">
                <div className="cd-icon">{selected.name?.charAt(0).toUpperCase()}</div>
                <div>
                  <h2>{selected.name}</h2>
                  {selected.topic && <span className="cd-topic">{selected.topic}</span>}
                </div>
              </div>
              <div className="cd-stats">
                <span><Users size={14} /> {selected.members?.length ?? 0} members</span>
              </div>
              <button
                className={`btn btn-sm ${isMember(selected) ? "btn-outline" : "btn-primary"}`}
                onClick={() => toggleJoin(selected._id || selected.id)}>
                {isMember(selected) ? "Leave" : "Join Community"}
              </button>
            </div>
          </div>

          <div className="container cd-body">
            {selected.description && <p className="cd-desc">{selected.description}</p>}

            {isMember(selected) && (
              <div className="cd-post-box card">
                <div className="cd-post-avatar">{user?.name?.charAt(0)}</div>
                <div className="cd-post-input">
                  <textarea
                    placeholder={`Share something with ${selected.name}…`}
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    rows={2}
                  />
                  <button className="btn btn-primary btn-sm" onClick={handlePost}
                    disabled={posting || !postText.trim()}>
                    <Send size={14} /> {posting ? "Posting…" : "Post"}
                  </button>
                </div>
              </div>
            )}

            {!isMember(selected) && (
              <div className="cd-join-prompt">
                <p>Join this community to read posts and participate in discussions.</p>
              </div>
            )}

            <div className="cd-posts">
              {!selected.posts?.length ? (
                <div className="empty-state" style={{ padding: "3rem" }}>
                  <MessageSquare size={40} /><h3>No posts yet</h3>
                  {isMember(selected) && <p>Be the first to post!</p>}
                </div>
              ) : (
                [...(selected.posts || [])].reverse().map((post) => {
                  const postLiked = (post.likes || []).some(
                    (l) => l?.toString() === myId || l?._id?.toString() === myId
                  );
                  return (
                    <div key={post._id || post.id} className="cd-post card">
                      <div className="cdp-author">
                        <div className="cdp-avatar">{post.author?.name?.charAt(0) || "?"}</div>
                        <div>
                          <div className="cdp-name">{post.author?.name || "Member"}</div>
                          <div className="cdp-role">
                            {post.author?.role}
                            {post.author?.college ? ` · ${post.author.college}` : ""}
                          </div>
                        </div>
                        <div className="cdp-time">
                          {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}
                        </div>
                      </div>
                      <p className="cdp-text">{post.text}</p>
                      <button
                        className={`rc-like-btn ${postLiked ? "liked" : ""}`}
                        onClick={() => handleLikePost(post._id || post.id)}>
                        <Heart size={14} fill={postLiked ? "#ef4444" : "none"} />
                        <span>{post.likes?.length || 0}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Communities;
