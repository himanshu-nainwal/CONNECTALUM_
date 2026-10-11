import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import config from "../../config";
import { StoreContext } from "../../context/StoreContext";
import {
  Calendar,
  MapPin,
  Tag,
  Users,
  Clock,
  Plus,
  X,
  Link,
  Download,
  Bell,
  Ticket,
  Video,
  FileText,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import "./Events.css";

const Events = () => {
  const { user, role, token, axiosAuth } = useContext(StoreContext);
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "tickets"
  const [myTickets, setMyTickets] = useState([]);

  const [form, setForm] = useState({
    title: "",
    department: "",
    location: "",
    eventDate: "",
    tags: "",
    price: 0,
    registrationDaysLeft: 14,
    description: "",
    speakers: "",
    meetingLink: "",
    allowedBatches: "2025, 2026, 2027",
    allowedDepartments: "Computer Science, Information Technology",
    recordingUrl: "",
    slidesUrl: "",
  });

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${config.API_URL}/events`);
      setEvents(res.data);
      if (res.data.length > 0 && !selected) setSelected(res.data[0]);
    } catch {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    if (!token) return;
    try {
      const res = await axiosAuth().get("/events/my-tickets");
      if (res.data.success) {
        setMyTickets(res.data.tickets);
      }
    } catch {}
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (activeTab === "tickets") fetchTickets();
  }, [activeTab]);

  const handlePost = async (e) => {
    e.preventDefault();
    setRegistering(true);
    try {
      await axiosAuth().post("/events", form);
      toast.success("Event and webinar hub posted!");
      setShowForm(false);
      setForm({
        title: "",
        department: "",
        location: "",
        eventDate: "",
        tags: "",
        price: 0,
        registrationDaysLeft: 14,
        description: "",
        speakers: "",
        meetingLink: "",
        allowedBatches: "2025, 2026, 2027",
        allowedDepartments: "Computer Science, Information Technology",
        recordingUrl: "",
        slidesUrl: "",
      });
      fetchEvents();
    } catch (err) {
      toast.error("Failed to post event");
    } finally {
      setRegistering(false);
    }
  };

  const handleRegister = async () => {
    if (!token) {
      toast.error("Please login to register");
      return;
    }
    setRegistering(true);
    try {
      const res = await axiosAuth().post("/events/register", { eventId: selected._id || selected.id });
      if (res.data.success) {
        toast.success(`RSVP confirmed! Ticket ID: ${res.data.ticketId}`);
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  const handleDownloadCalendarIcs = (eventId) => {
    window.open(`${config.API_URL}/events/${eventId}/calendar.ics`, "_blank");
    toast.success("Google Calendar (.ics) file downloaded!");
  };

  const handleSendReminders = async (eventId) => {
    try {
      const res = await axiosAuth().post(`/events/${eventId}/remind`);
      if (res.data.success) {
        toast.success(res.data.message);
      }
    } catch {
      toast.error("Failed to dispatch reminders");
    }
  };

  if (loading)
    return (
      <div className="events-loader">
        <div className="spinner" />
      </div>
    );

  return (
    <div className="events-wrapper">
      <div className="events-top-bar">
        <div className="top-modes">
          <button className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>
            <Calendar size={16} /> All Alumni Events & Webinars
          </button>
          {token && (
            <button className={activeTab === "tickets" ? "active" : ""} onClick={() => setActiveTab("tickets")}>
              <Ticket size={16} /> My RSVP Tickets ({myTickets.length})
            </button>
          )}
        </div>
      </div>

      {activeTab === "tickets" ? (
        <div className="my-tickets-pane">
          <h2>My Event RSVP Tickets</h2>
          <p>Present these tickets upon campus auditorium check-in or access virtual Google Meet sessions.</p>
          {myTickets.length === 0 ? (
            <div className="empty-state">
              <Ticket size={48} />
              <h3>No Event Tickets Found</h3>
              <p>Browse events and click "RSVP & Get Ticket" to secure your pass.</p>
            </div>
          ) : (
            <div className="tickets-grid">
              {myTickets.map((t) => (
                <div key={t._id} className="ticket-card card">
                  <div className="ticket-top">
                    <span className="ticket-id">{t.ticket_id}</span>
                    <span className="badge-confirmed">
                      <CheckCircle2 size={12} /> Confirmed
                    </span>
                  </div>
                  <h3>{t.event?.title}</h3>
                  <div className="ticket-details">
                    <div>
                      <MapPin size={13} /> {t.event?.location}
                    </div>
                    <div>
                      <Calendar size={13} /> {t.event?.updated_on || "Upcoming Session"}
                    </div>
                  </div>
                  <div className="ticket-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => handleDownloadCalendarIcs(t.event?._id)}>
                      <Download size={13} /> Sync to Google Calendar
                    </button>
                    {t.event?.meeting_link && (
                      <a href={t.event.meeting_link} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary">
                        <Link size={13} /> Open Meeting
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="events-layout">
          {/* Sidebar */}
          <div className="events-sidebar">
            <div className="events-sidebar-header">
              <h3>Upcoming Sessions</h3>
              {(role === "alumni" || role === "admin" || role === "master_admin") && (
                <button className="btn btn-sm btn-primary" onClick={() => setShowForm(!showForm)}>
                  {showForm ? <X size={14} /> : <Plus size={14} />}
                </button>
              )}
            </div>

            {showForm ? (
              <form onSubmit={handlePost} className="event-post-form">
                <input
                  className="input"
                  placeholder="Event Title *"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Department Filter (e.g. CSE) *"
                  required
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Location (e.g. Auditorium / Google Meet) *"
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
                <input
                  className="input"
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Eligible Batches (e.g. 2025, 2026)"
                  value={form.allowedBatches}
                  onChange={(e) => setForm({ ...form, allowedBatches: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Tags (comma separated)"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
                <textarea
                  className="textarea"
                  placeholder="Event Description *"
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ minHeight: 80 }}
                />
                <input
                  className="input"
                  placeholder="Speakers (comma separated)"
                  value={form.speakers}
                  onChange={(e) => setForm({ ...form, speakers: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Google Meet / Zoom Link"
                  value={form.meetingLink}
                  onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Recording Archive URL (optional)"
                  value={form.recordingUrl}
                  onChange={(e) => setForm({ ...form, recordingUrl: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Presentation Slides Link (optional)"
                  value={form.slidesUrl}
                  onChange={(e) => setForm({ ...form, slidesUrl: e.target.value })}
                />
                <button type="submit" className="btn btn-primary w-full" disabled={registering}>
                  {registering ? "Publishing..." : "Publish Event Hub"}
                </button>
                <button type="button" className="btn btn-ghost w-full" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </form>
            ) : (
              <div className="events-list">
                {events.length === 0 ? (
                  <div className="empty-state" style={{ padding: "24px 0" }}>
                    <Calendar size={32} />
                    <p style={{ marginTop: 8 }}>No events yet</p>
                  </div>
                ) : (
                  events.map((ev) => (
                    <div
                      key={ev.id || ev._id}
                      className={`event-item ${
                        selected?._id === ev._id || selected?.id === ev.id ? "selected" : ""
                      }`}
                      onClick={() => setSelected(ev)}
                    >
                      <h4>{ev.title}</h4>
                      <p className="event-item-dept">{ev.department}</p>
                      <div className="event-item-footer">
                        <span className={`badge ${ev.price === 0 ? "badge-green" : "badge-amber"}`}>
                          {ev.price === 0 ? "Free Access" : `₹${ev.price}`}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {ev.registration_days_left}d left
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Details */}
          {selected && !showForm ? (
            <div className="event-detail">
              <div className="event-detail-header">
                <h2>{selected.title}</h2>
                {selected.tags?.length > 0 && (
                  <div className="event-detail-tags">
                    {selected.tags.map((t, i) => (
                      <span key={i} className="badge badge-blue">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="event-detail-meta">
                <span>
                  <MapPin size={14} /> {selected.location}
                </span>
                <span>
                  <Tag size={14} /> {selected.department}
                </span>
                <span>
                  <Calendar size={14} /> {selected.updated_on}
                </span>
                <span>
                  <Clock size={14} /> {selected.registration_days_left} days left
                </span>
              </div>

              {selected.allowed_batches?.length > 0 && (
                <div className="batch-dept-restriction-bar">
                  <span>Batch Restrictions: [ {selected.allowed_batches.join(", ")} ]</span>
                </div>
              )}

              <p className="event-detail-desc">{selected.description}</p>

              {selected.speakers?.length > 0 && (
                <div className="event-speakers">
                  <h4>Alumni Speakers & Guests</h4>
                  <p>{Array.isArray(selected.speakers) ? selected.speakers.join(", ") : selected.speakers}</p>
                </div>
              )}

              {/* Archive recordings and slides */}
              {(selected.recording_url || selected.slidesUrl || selected.slides_url) && (
                <div className="event-archives-box">
                  <h4>📁 Post-Event Archives & Materials</h4>
                  <div className="archive-links">
                    {selected.recording_url && (
                      <a href={selected.recording_url} target="_blank" rel="noreferrer" className="archive-link">
                        <Video size={14} /> Watch Session Recording
                      </a>
                    )}
                    {(selected.slides_url || selected.slidesUrl) && (
                      <a
                        href={selected.slides_url || selected.slidesUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="archive-link"
                      >
                        <FileText size={14} /> Download Presentation Slides
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="event-bottom-toolbar">
                <button className="btn btn-outline" onClick={() => handleDownloadCalendarIcs(selected._id || selected.id)}>
                  <Download size={14} /> Add to Google Calendar (.ics)
                </button>
                {(role === "alumni" || role === "admin" || role === "master_admin") && (
                  <button className="btn btn-outline" onClick={() => handleSendReminders(selected._id || selected.id)}>
                    <Bell size={14} /> Send 24h/15m Reminders
                  </button>
                )}
                {selected.meeting_link && (
                  <a
                    href={selected.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                  >
                    <Link size={14} /> Join Session
                  </a>
                )}
              </div>

              <div className="event-register">
                <div className="event-price">{selected.price === 0 ? "Free" : `₹${selected.price}`}</div>
                <button className="btn btn-primary btn-lg" onClick={handleRegister} disabled={registering}>
                  {registering ? "Reserving Ticket..." : "RSVP & Generate Pass"}
                </button>
              </div>
            </div>
          ) : (
            !showForm && (
              <div className="event-detail flex-center" style={{ color: "var(--text-muted)" }}>
                <div className="empty-state">
                  <Calendar size={48} />
                  <h3>Select an event</h3>
                  <p>Click an event from the list to view details, calendar sync, and tickets.</p>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Events;
