import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { StoreContext } from '../../context/StoreContext';
import { User, Save, GraduationCap, Briefcase, Building2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
  const { user, token, setUser, role } = useContext(StoreContext);
  const [form, setForm] = useState({ college: '', grad_year: '', department: '', job_role: '', company: '', skills: '', name: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        college: user.college || '',
        grad_year: user.grad_year || '',
        department: user.department || '',
        job_role: user.job_role || '',
        company: user.company || '',
        skills: Array.isArray(user.skills) ? user.skills.join(', ') : user.skills || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put(`${config.API_URL}/user/profile`, {
        ...form,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean)
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.success) {
        setUser({ ...user, ...res.data.user });
        toast.success("Profile updated!");
      }
    } catch { toast.error("Failed to update profile"); }
    finally { setSaving(false); }
  };

  if (!user) return (
    <div className="profile-page"><div className="empty-state"><User size={48} /><h3>Please login</h3></div></div>
  );

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-layout">
          <div className="profile-sidebar">
            <div className="profile-avatar">{user.name?.charAt(0)?.toUpperCase()}</div>
            <h2>{user.name}</h2>
            <span className="badge badge-blue">{role}</span>
            <p className="profile-email">{user.email}</p>
            {user.college && <p className="profile-meta"><GraduationCap size={14} /> {user.college}</p>}
            {user.company && <p className="profile-meta"><Building2 size={14} /> {user.company}</p>}
            {user.job_role && <p className="profile-meta"><Briefcase size={14} /> {user.job_role}</p>}
          </div>

          <div className="profile-form-wrap card">
            <div className="profile-form-header">
              <User size={20} />
              <h3>Edit Profile</h3>
            </div>
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label>Full Name</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>College / University</label>
                  <input className="input" placeholder="Your institution" value={form.college}
                    onChange={e => setForm({ ...form, college: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Graduation Year</label>
                  <input className="input" type="number" placeholder="e.g. 2024" value={form.grad_year}
                    onChange={e => setForm({ ...form, grad_year: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Department / Branch</label>
                <input className="input" placeholder="e.g. Computer Science" value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value })} />
              </div>
              {role === 'alumni' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Current Role</label>
                    <input className="input" placeholder="e.g. Software Engineer" value={form.job_role}
                      onChange={e => setForm({ ...form, job_role: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Company</label>
                    <input className="input" placeholder="e.g. Google" value={form.company}
                      onChange={e => setForm({ ...form, company: e.target.value })} />
                  </div>
                </div>
              )}
              <div className="form-group">
                <label><Tag size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Skills (comma separated)</label>
                <input className="input" placeholder="e.g. React, Node.js, Python" value={form.skills}
                  onChange={e => setForm({ ...form, skills: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
