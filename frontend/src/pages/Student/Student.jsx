import { useState, useRef, useContext } from "react";
import { ArrowRight, GraduationCap, BookOpen, Users } from "lucide-react";
import Mentors from "../../components/Mentors/Mentors";
import Events from "../../components/Events/Events";
import Jobs from "../../components/Jobs/Jobs";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import "./Student.css";

const TABS = [
  { id: "mentors", label: "Find Mentors" },
  { id: "events", label: "Events" },
  { id: "jobs", label: "Jobs & Internships" },
];

const Student = () => {
  const [tab, setTab] = useState("mentors");
  const tabsRef = useRef(null);
  const { token, setShowLogin } = useContext(StoreContext);
  const navigate = useNavigate();

  const scrollTo = (t) => {
    setTab(t);
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleOpenMessages = (userId, userName) => {
    navigate(`/messages?userId=${userId}&userName=${encodeURIComponent(userName)}`);
  };

  return (
    <div className="student-page">
      <section className="portal-hero">
        <div className="container">
          <div className="portal-hero-content">
            <div className="badge badge-blue"><GraduationCap size={14} /> Student Portal</div>
            <h1>Connect with Industry Experts</h1>
            <p>Access mentorship, exclusive job listings, and events to accelerate your career.</p>
            <div className="portal-hero-btns">
              <button className="btn btn-primary btn-lg" onClick={() => scrollTo('mentors')}>
                Find a Mentor <ArrowRight size={18} />
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => navigate('/resources')}>
                <BookOpen size={16} /> Browse Resources
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => navigate('/communities')}>
                <Users size={16} /> Communities
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="portal-tabs-section container" ref={tabsRef}>
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
          {tab === "mentors" && <Mentors onOpenMessages={handleOpenMessages} />}
          {tab === "events" && <Events />}
          {tab === "jobs" && <Jobs />}
        </div>
      </section>
    </div>
  );
};
export default Student;
