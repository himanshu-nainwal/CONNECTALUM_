import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import config from "../../config";
import { StoreContext } from "../../context/StoreContext";
import { Calendar, MapPin, Tag, Users, Clock, Plus, X, Link } from "lucide-react";
import toast from "react-hot-toast";
import "./Events.css";

const Events = () => {
  const { user, role, token } = useContext(StoreContext);
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [form, setForm] = useState({
    title: "", department: "", location: "", eventDate: "", tags: "",
    price: 0, registrationDaysLeft: 30, description: "", speakers: "", meetingLink: ""
  });

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${config.API_URL}/events`);
      setEvents(res.data);
      if (res.data.length > 0) setSelected(res.data[0]);
    } catch { toast.error("Failed to load events"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    setRegistering(true);
    try {
      await axios.post(`${config.API_URL}/events/create`, form, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Event posted!");
      setShowForm(false);
      setForm({ title: "", department: "", location: "", eventDate: "", tags: "", price: 0, registrationDaysLeft: 30, description: "", speakers: "", meetingLink: "" });
      fetchEvents();
    } catch { toast.error("Failed to post event"); }
    finally { setRegistering(false); }
  };

  const handleRegister = async () => {
    if (!token) { toast.error("Please login to register"); return; }
    setRegistering(true);
    try {
      await axios.post(`${config.API_URL}/events/register`, { eventId: selected._id || selected.id }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Registered successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally { setRegistering(false); }
  };

  if (loading) return <div className="events-loader"><div className="spinner" /></div>;

  return (
    <div className="events-layout">
      {/* Sidebar */}
      <div className="events-sidebar">
        <div className="events-sidebar-header">
          <h3>Events</h3>
          {role === 'alumni' && (
            <button className="btn btn-sm btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? <X size={14} /> : <Plus size={14} />}
            </button>
          )}
        </div>

        {showForm ? (
          <form onSubmit={handlePost} className="event-post-form">
            <input className="input" placeholder="Title *" required value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} />
            <input className="input" placeholder="Department *" required value={form.department}
              onChange={e => setForm({ ...form, department: e.target.value })} />
            <input className="input" placeholder="Location *" required value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })} />
            <input className="input" type="date" value={form.eventDate}
              onChange={e => setForm({ ...form, eventDate: e.target.value })} />
            <input className="input" placeholder="Price (0=Free)" type="number" value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })} />
            <input className="input" placeholder="Tags (comma separated)" value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })} />
            <textarea className="textarea" placeholder="Description *" required value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} style={{ minHeight: 80 }} />
            <input className="input" placeholder="Speakers (comma separated)" value={form.speakers}
              onChange={e => setForm({ ...form, speakers: e.target.value })} />
            <input className="input" placeholder="Meeting Link (optional)" value={form.meetingLink}
              onChange={e => setForm({ ...form, meetingLink: e.target.value })} />
            <button type="submit" className="btn btn-primary w-full" disabled={registering}>
              {registering ? "Posting..." : "Post Event"}
            </button>
            <button type="button" className="btn btn-ghost w-full" onClick={() => setShowForm(false)}>Cancel</button>
          </form>
        ) : (
          <div className="events-list">
            {events.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <Calendar size={32} />
                <p style={{ marginTop: 8 }}>No events yet</p>
              </div>
            ) : events.map(ev => (
              <div key={ev.id} className={`event-item ${selected?._id === ev._id || selected?.id === ev.id ? 'selected' : ''}`}
                onClick={() => setSelected(ev)}>
                <h4>{ev.title}</h4>
                <p className="event-item-dept">{ev.department}</p>
                <div className="event-item-footer">
                  <span className={`badge ${ev.price === 0 ? 'badge-green' : 'badge-amber'}`}>
                    {ev.price === 0 ? 'Free' : `₹${ev.price}`}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {ev.registration_days_left}d left
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      {selected && !showForm ? (
        <div className="event-detail">
          <div className="event-detail-header">
            <h2>{selected.title}</h2>
            {selected.tags?.map && (
              <div className="event-detail-tags">
                {selected.tags.map((t, i) => <span key={i} className="badge badge-blue">{t}</span>)}
              </div>
            )}
          </div>
          <div className="event-detail-meta">
            <span><MapPin size={14} /> {selected.location}</span>
            <span><Tag size={14} /> {selected.department}</span>
            <span><Calendar size={14} /> {selected.updated_on}</span>
            <span><Clock size={14} /> {selected.registration_days_left} days left</span>
          </div>
          <p className="event-detail-desc">{selected.description}</p>
          {selected.speakers?.length > 0 && (
            <div className="event-speakers">
              <h4>Speakers</h4>
              <p>{Array.isArray(selected.speakers) ? selected.speakers.join(', ') : selected.speakers}</p>
            </div>
          )}
          {selected.meeting_link && (
            <a href={selected.meeting_link} target="_blank" rel="noopener noreferrer"
              className="btn btn-outline" style={{ width: 'fit-content' }}>
              <Link size={14} /> Join Meeting
            </a>
          )}
          <div className="event-register">
            <div className="event-price">
              {selected.price === 0 ? 'Free' : `₹${selected.price}`}
            </div>
            {role !== 'alumni' && (
              <button className="btn btn-primary btn-lg" onClick={handleRegister} disabled={registering}>
                {registering ? "Registering..." : "Register Now"}
              </button>
            )}
          </div>
        </div>
      ) : !showForm && (
        <div className="event-detail flex-center" style={{ color: 'var(--text-muted)' }}>
          <div className="empty-state">
            <Calendar size={48} />
            <h3>Select an event</h3>
            <p>Click an event from the list to view details</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
