import React, { useState, useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import config from "../../config";
import { CheckCircle, User, Linkedin } from "lucide-react";
import toast from "react-hot-toast";
import "./MentorForm.css";

const MentorForm = ({ onSuccess }) => {
  const { token } = useContext(StoreContext);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', organization: '', location: '',
    experience: '', expertise: '', communication: [],
    linkedin: '', twitter: '', profileLink: ''
  });

  const comms = ['Email', 'LinkedIn', 'Video Call', 'WhatsApp'];

  const toggleComm = (c) => {
    setForm(f => ({
      ...f, communication: f.communication.includes(c)
        ? f.communication.filter(x => x !== c)
        : [...f.communication, c]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) { toast.error("Name is required"); return; }
    setSubmitting(true);
    try {
      await axios.post(`${config.API_URL}/mentors/add`, form, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("You're now registered as a mentor!");
      onSuccess?.();
    } catch { toast.error("Failed to register as mentor"); }
    finally { setSubmitting(false); }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="mentor-form-wrap card">
      <div className="mentor-form-header">
        <User size={24} />
        <div>
          <h2>Become a Mentor</h2>
          <p>Share your expertise with the next generation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mentor-form">
        <div className="form-row">
          <div className="form-group"><label>First Name *</label><input className="input" required value={form.firstName} onChange={set('firstName')} /></div>
          <div className="form-group"><label>Last Name *</label><input className="input" required value={form.lastName} onChange={set('lastName')} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Organization</label><input className="input" placeholder="Company/Institution" value={form.organization} onChange={set('organization')} /></div>
          <div className="form-group"><label>Location</label><input className="input" placeholder="City, Country" value={form.location} onChange={set('location')} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Years of Experience</label><input className="input" type="number" min="0" value={form.experience} onChange={set('experience')} /></div>
          <div className="form-group"><label>Area of Expertise</label><input className="input" placeholder="e.g. Machine Learning, Web Dev" value={form.expertise} onChange={set('expertise')} /></div>
        </div>
        <div className="form-group">
          <label>Preferred Communication</label>
          <div className="comm-chips">
            {comms.map(c => (
              <button key={c} type="button"
                className={`comm-chip ${form.communication.includes(c) ? 'active' : ''}`}
                onClick={() => toggleComm(c)}>
                {form.communication.includes(c) && <CheckCircle size={13} />} {c}
              </button>
            ))}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label><Linkedin size={14} style={{ display:'inline', verticalAlign:'middle' }} /> LinkedIn</label><input className="input" type="url" placeholder="https://linkedin.com/in/..." value={form.linkedin} onChange={set('linkedin')} /></div>
          <div className="form-group"><label>Profile Link</label><input className="input" type="url" placeholder="Personal website" value={form.profileLink} onChange={set('profileLink')} /></div>
        </div>
        <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
          {submitting ? "Submitting..." : "Register as Mentor"}
        </button>
      </form>
    </div>
  );
};

export default MentorForm;
