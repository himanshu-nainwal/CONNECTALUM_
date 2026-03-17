import { useState, useEffect, useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import config from "../../config";
import { Users, UserCheck, UserX, Briefcase, GraduationCap, Building2, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import "./Connections.css";

const Connections = () => {
  const { token, user } = useContext(StoreContext);
  const [connections, setConnections] = useState([]);
  const [pending, setPending] = useState([]);
  const [tab, setTab] = useState("connections");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAll = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [connRes, pendingRes] = await Promise.all([
        axios.get(`${config.API_URL}/connections/mine`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${config.API_URL}/connections/pending`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setConnections(connRes.data.connections || []);
      setPending(pendingRes.data.requests || []);
    } catch { toast.error("Failed to load connections"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [token]);

  const respond = async (connectionId, action) => {
    try {
      await axios.put(`${config.API_URL}/connections/respond`, { connectionId, action }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(action === "accepted" ? "Connection accepted!" : "Request declined");
      fetchAll();
    } catch { toast.error("Failed"); }
  };

  if (!token) return (
    <div className="connections-page"><div className="empty-state"><Users size={48} /><h3>Please login</h3></div></div>
  );

  return (
    <div className="connections-page">
      <div className="connections-hero">
        <div className="container">
          <h1><Users size={28} /> My Network</h1>
          <p>Manage your connections and pending requests</p>
        </div>
      </div>

      <div className="container connections-body">
        <div className="conn-tabs">
          <button className={`tab-btn ${tab === "connections" ? "active" : ""}`} onClick={() => setTab("connections")}>
            Connections <span className="tab-count">{connections.length}</span>
          </button>
          <button className={`tab-btn ${tab === "pending" ? "active" : ""}`} onClick={() => setTab("pending")}>
            Pending Requests {pending.length > 0 && <span className="tab-count pending-count">{pending.length}</span>}
          </button>
        </div>

        {loading ? (
          <div className="connections-grid">{Array(4).fill(0).map((_, i) => (
            <div key={i} className="conn-card card"><div className="skeleton" style={{ height: 100 }} /></div>
          ))}</div>
        ) : tab === "connections" ? (
          connections.length === 0 ? (
            <div className="empty-state"><Users size={48} /><h3>No connections yet</h3><p>Find alumni on the Student Portal and send connection requests!</p></div>
          ) : (
            <div className="connections-grid">
              {connections.map(c => (
                <div key={c.connectionId} className="conn-card card">
                  <div className="conn-avatar">{c.user?.name?.charAt(0)}</div>
                  <div className="conn-info">
                    <h3>{c.user?.name}</h3>
                    <span className={`badge badge-${c.user?.role === "alumni" ? "amber" : "blue"}`}>{c.user?.role}</span>
                    {c.user?.job_role && <div className="conn-meta"><Briefcase size={12} /> {c.user.job_role}</div>}
                    {c.user?.company && <div className="conn-meta"><Building2 size={12} /> {c.user.company}</div>}
                    {c.user?.college && <div className="conn-meta"><GraduationCap size={12} /> {c.user.college}</div>}
                  </div>
                  <button className="btn btn-sm btn-primary conn-msg-btn"
                    onClick={() => navigate(`/messages?userId=${c.user?._id}&userName=${c.user?.name}`)}>
                    <MessageCircle size={14} /> Message
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          pending.length === 0 ? (
            <div className="empty-state"><UserCheck size={48} /><h3>No pending requests</h3></div>
          ) : (
            <div className="connections-grid">
              {pending.map(req => (
                <div key={req._id} className="conn-card card">
                  <div className="conn-avatar">{req.requester?.name?.charAt(0)}</div>
                  <div className="conn-info">
                    <h3>{req.requester?.name}</h3>
                    <span className={`badge badge-${req.requester?.role === "alumni" ? "amber" : "blue"}`}>{req.requester?.role}</span>
                    {req.requester?.job_role && <div className="conn-meta"><Briefcase size={12} /> {req.requester.job_role}</div>}
                    {req.requester?.company && <div className="conn-meta"><Building2 size={12} /> {req.requester.company}</div>}
                  </div>
                  <div className="conn-respond-btns">
                    <button className="btn btn-sm btn-primary" onClick={() => respond(req._id, "accepted")}>
                      <UserCheck size={14} /> Accept
                    </button>
                    <button className="btn btn-sm btn-outline" onClick={() => respond(req._id, "rejected")}>
                      <UserX size={14} /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Connections;
