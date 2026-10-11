import { useState, useRef, useContext } from "react";
import { ArrowRight, GraduationCap, BookOpen, Users, Sparkles, Bot, HelpCircle } from "lucide-react";
import Mentors from "../../components/Mentors/Mentors";
import Events from "../../components/Events/Events";
import Jobs from "../../components/Jobs/Jobs";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import "./Student.css";

const TABS = [
  { id: "jobs", label: "Jobs, Internships & AI Matches" },
  { id: "mentors", label: "1-on-1 Mentorship Marketplace" },
  { id: "events", label: "Events & RSVP Tickets" },
];

const Student = () => {
  const [tab, setTab] = useState("jobs");
  const tabsRef = useRef(null);
  const { token, setShowLogin } = useContext(StoreContext);
  const navigate = useNavigate();

  const scrollTo = (t) => {
    setTab(t);
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleOpenMessages = (userId, userName) => {
    navigate(`/messages?userId=${userId}&userName=${encodeURIComponent(userName)}`);
  };

  return (
    <div className="student-page">
      <section className="portal-hero">
        <div className="container">
          <div className="portal-hero-content">
            <div className="badge badge-blue">
              <GraduationCap size={14} /> Student Portal & AI Career Suite
            </div>
            <h1>Bridge the Academia-to-Industry Gap with AI</h1>
            <p>
              Leverage Gemini semantic job matching, automated ATS resume diagnostics, real-time AI mock interviews, and
              1-click verified alumni referrals.
            </p>
            <div className="portal-hero-btns">
              <button className="btn btn-primary btn-lg" onClick={() => navigate("/resume-analyzer")}>
                <Sparkles size={16} /> AI Resume Diagnostic
              </button>
              <button className="btn btn-primary btn-lg" onClick={() => navigate("/mock-interview")}>
                <Bot size={16} /> AI Mock Interview Coach
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => scrollTo("jobs")}>
                1-Click Referrals <ArrowRight size={16} />
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => navigate("/qna")}>
                <HelpCircle size={16} /> Community Q&A
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="portal-tabs-section container" ref={tabsRef}>
        <div className="portal-tabs-header">
          <div className="tabs-wrapper">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`tab-btn ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="tab-panel">
          {tab === "jobs" && <Jobs />}
          {tab === "mentors" && <Mentors onOpenMessages={handleOpenMessages} />}
          {tab === "events" && <Events />}
        </div>
      </section>
    </div>
  );
};
export default Student;
