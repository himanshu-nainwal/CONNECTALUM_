import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import {
  GraduationCap, Briefcase, ArrowRight, BookOpen,
  Users, Star, Lightbulb, Trophy, Search, Calendar
} from "lucide-react";
import "./PortalSelector.css";

const PortalSelector = () => {
  const { token, role, setShowLogin } = useContext(StoreContext);
  const navigate = useNavigate();

  const handleStudentClick = () => {
    if (!token) { setShowLogin(true); return; }
    navigate("/student");
  };

  const handleAlumniClick = () => {
    if (!token) { setShowLogin(true); return; }
    navigate("/alumni");
  };

  return (
    <section className="portal-selector" id="portals">
      <div className="ps-container">
        <div className="ps-header">
          <div className="ps-badge">
            <Star size={13} /> Choose Your Portal
          </div>
          <h2 className="ps-title">
            Who Are You Here As?
          </h2>
          <p className="ps-subtitle">
            Select your role to access a personalized experience built just for you
          </p>
        </div>

        <div className="ps-cards">
          {/* Student Card */}
          <div className={`ps-card ps-student ${(!token || role === 'student') ? '' : 'ps-dimmed'}`}>
            <div className="ps-card-glow glow-blue" />

            <div className="ps-card-header">
              <div className="ps-icon-wrap icon-blue">
                <GraduationCap size={32} />
              </div>
              <div className="ps-role-tag tag-blue">Student</div>
            </div>

            <h3 className="ps-card-title">I'm a Student</h3>
            <p className="ps-card-desc">
              Find mentors, discover jobs & internships, register for events, and grow your network with industry professionals.
            </p>

            <div className="ps-features-list">
              <div className="ps-feature">
                <Search size={15} />
                <span>Browse alumni mentors by expertise</span>
              </div>
              <div className="ps-feature">
                <Briefcase size={15} />
                <span>Access exclusive job &amp; internship listings</span>
              </div>
              <div className="ps-feature">
                <Calendar size={15} />
                <span>Register for workshops &amp; events</span>
              </div>
              <div className="ps-feature">
                <Users size={15} />
                <span>Join community chat rooms</span>
              </div>
            </div>

            <button className="ps-btn btn-student" onClick={handleStudentClick}>
              {token && role === 'student' ? 'Go to Student Portal' : 'Enter as Student'}
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Divider */}
          <div className="ps-divider">
            <div className="ps-divider-line" />
            <span className="ps-divider-text">or</span>
            <div className="ps-divider-line" />
          </div>

          {/* Alumni Card */}
          <div className={`ps-card ps-alumni ${(!token || role === 'alumni') ? '' : 'ps-dimmed'}`}>
            <div className="ps-card-glow glow-amber" />

            <div className="ps-card-header">
              <div className="ps-icon-wrap icon-amber">
                <Trophy size={32} />
              </div>
              <div className="ps-role-tag tag-amber">Alumni</div>
            </div>

            <h3 className="ps-card-title">I'm an Alumni</h3>
            <p className="ps-card-desc">
              Give back to your community by mentoring students, posting job opportunities, organizing events, and building lasting connections.
            </p>

            <div className="ps-features-list">
              <div className="ps-feature">
                <Lightbulb size={15} />
                <span>Become a mentor &amp; guide students</span>
              </div>
              <div className="ps-feature">
                <Briefcase size={15} />
                <span>Post jobs &amp; internship opportunities</span>
              </div>
              <div className="ps-feature">
                <Calendar size={15} />
                <span>Create &amp; manage events</span>
              </div>
              <div className="ps-feature">
                <BookOpen size={15} />
                <span>Build your alumni network</span>
              </div>
            </div>

            <button className="ps-btn btn-alumni" onClick={handleAlumniClick}>
              {token && role === 'alumni' ? 'Go to Alumni Portal' : 'Enter as Alumni'}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {!token && (
          <p className="ps-note">
            Don't have an account?{" "}
            <button className="ps-note-link" onClick={() => setShowLogin(true)}>
              Sign up for free
            </button>{" "}
            — it only takes a minute
          </p>
        )}
      </div>
    </section>
  );
};

export default PortalSelector;
