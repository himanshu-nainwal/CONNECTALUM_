import React, { useState } from "react";
import { ArrowRight, Users, BookOpen, Globe } from "lucide-react";
import Mentoring from "../../components/Mentoring/Mentoring";
import Networking from "../../components/Networking/Networking";
import Contribution from "../../components/Contribution/Contribution";
import MentorForm from "../../components/MentorForm/MentorForm";
import { useNavigate } from "react-router-dom";
import "./Alumini.css";

const TABS = [
  { id: "mentoring", label: "Alumni Network" },
  { id: "networking", label: "Manage Events" },
  { id: "contribution", label: "Post Jobs" },
];

const Alumini = () => {
  const [tab, setTab] = useState("mentoring");
  const [mentorFormOpen, setMentorFormOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="alumni-page">
      <section className="portal-hero alumni-hero">
        <div className="container">
          <div className="portal-hero-content">
            <div className="badge badge-amber"><Users size={14} /> Alumni Portal</div>
            <h1>Give Back to Your Community</h1>
            <p>Share your expertise, mentor students, and connect with fellow alumni professionals.</p>
            <div className="portal-hero-btns">
              <button className="btn btn-primary btn-lg" onClick={() => setMentorFormOpen(true)}>
                Become a Mentor <ArrowRight size={18} />
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => setTab("contribution")}>
                Post a Job
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => navigate('/resources')}>
                <BookOpen size={16} /> Share Resources
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => navigate('/communities')}>
                <Globe size={16} /> Create Community
              </button>
            </div>
          </div>
        </div>
      </section>

      {mentorFormOpen && (
        <div className="mentor-form-modal-overlay" onClick={() => setMentorFormOpen(false)}>
          <div className="mentor-form-modal" onClick={e => e.stopPropagation()}>
            <button className="btn btn-ghost btn-sm modal-close" onClick={() => setMentorFormOpen(false)}>✕ Close</button>
            <MentorForm onSuccess={() => setMentorFormOpen(false)} />
          </div>
        </div>
      )}

      <section className="portal-tabs-section container">
        <div className="portal-tabs-header">
          <div className="tabs-wrapper">
            {TABS.map(t => (
              <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="tab-panel">
          {tab === "mentoring" && <Mentoring />}
          {tab === "networking" && <Networking />}
          {tab === "contribution" && <Contribution />}
        </div>
      </section>
    </div>
  );
};
export default Alumini;
