import { useEffect, useState, useContext } from "react";
import config from "../../config";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { Search, Building2, Briefcase, GraduationCap, Filter, UserCheck, UserPlus, Clock, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import "./Mentors.css";

const MentorSkeleton = () => (
  <div className="mentor-card card">
    <div className="skeleton" style={{ height: 60, marginBottom: 12 }} />
    <div className="skeleton" style={{ height: 16, width: "70%", marginBottom: 8 }} />
    <div className="skeleton" style={{ height: 14, width: "50%" }} />
  </div>
);

const ConnectButton = ({ mentorId, mentorName, onMessage }) => {
  const { token } = useContext(StoreContext);
  const [status, setStatus] = useState("none");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !mentorId) { setLoading(false); return; }
    axios.get(`${config.API_URL}/connections/status/${mentorId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => { setStatus(r.data.status); }).catch(() => {}).finally(() => setLoading(false));
  }, [mentorId, token]);

  const handleConnect = async () => {
    if (!token) { toast.error("Please login first"); return; }
    setLoading(true);
    try {
      await axios.post(`${config.API_URL}/connections/request`, { recipientId: mentorId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatus("pending");
      toast.success(`Connection request sent to ${mentorName}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    } finally { setLoading(false); }
  };

  if (loading) return <button className="btn btn-sm btn-outline" disabled>...</button>;
  if (status === "accepted") return (
    <div className="mentor-actions">
      <span className="connected-badge"><UserCheck size={13} /> Connected</span>
      <button className="btn btn-sm btn-primary" onClick={() => onMessage && onMessage(mentorId, mentorName)}>
        <MessageCircle size={13} /> Message
      </button>
    </div>
  );
  if (status === "pending") return (
    <button className="btn btn-sm btn-outline" disabled><Clock size={13} /> Pending</button>
  );
  return (
    <button className="btn btn-sm btn-primary" onClick={handleConnect}>
      <UserPlus size={13} /> Connect
    </button>
  );
};

const Mentors = ({ onOpenMessages }) => {
  const { user } = useContext(StoreContext);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCollege, setFilterCollege] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetch(`${config.API_URL}/user/alumni?${params}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setMentors(d))
      .catch(() => setError("Failed to load alumni"))
      .finally(() => setLoading(false));
  }, [search]);

  const filtered = filterCollege && user?.college
    ? mentors.filter(m => m.college?.toLowerCase() === user.college?.toLowerCase())
    : mentors;
  const visible = showAll ? filtered : filtered.slice(0, 9);

  return (
    <div className="mentors-wrapper">
      <div className="mentors-controls">
        <div className="search-bar">
          <Search size={16} />
          <input placeholder="Search by name, company, role..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {user?.college && (
          <button className={`btn btn-sm ${filterCollege ? "btn-primary" : "btn-outline"}`} onClick={() => setFilterCollege(!filterCollege)}>
            <Filter size={14} /> My College
          </button>
        )}
      </div>
      {loading ? (
        <div className="mentors-grid">{Array(6).fill(0).map((_, i) => <MentorSkeleton key={i} />)}</div>
      ) : error ? (
        <div className="empty-state"><p>{error}</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><GraduationCap size={48} /><h3>No alumni found</h3><p>Try adjusting your search</p></div>
      ) : (
        <>
          <div className="mentors-grid">
            {visible.map(m => (
              <div key={m.id || m._id} className="mentor-card card">
                <div className="mentor-avatar">{(m.name || "A").charAt(0).toUpperCase()}</div>
                <h3 className="mentor-name">{m.name}</h3>
                {m.college && <div className="mentor-info"><GraduationCap size={13} /> {m.college}</div>}
                {m.job_role && <div className="mentor-info"><Briefcase size={13} /> {m.job_role}</div>}
                {m.company && <div className="mentor-info"><Building2 size={13} /> {m.company}</div>}
                {m.skills?.length > 0 && (
                  <div className="mentor-skills">
                    {(Array.isArray(m.skills) ? m.skills : [m.skills]).slice(0, 3).map((s, i) => (
                      <span key={i} className="badge badge-blue skill-badge">{s}</span>
                    ))}
                  </div>
                )}
                {m.grad_year && <div className="mentor-grad"><span className="badge badge-gray">Class of {m.grad_year}</span></div>}
                <ConnectButton mentorId={m.id || m._id} mentorName={m.name} onMessage={onOpenMessages} />
              </div>
            ))}
          </div>
          {filtered.length > 9 && (
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button className="btn btn-outline" onClick={() => setShowAll(!showAll)}>
                {showAll ? "Show Less" : `Show All (${filtered.length})`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Mentors;
