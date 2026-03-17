import React, { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Users, BookOpen, Briefcase, Star } from "lucide-react";
import "./Hero.css";

const Hero = () => {
  const { token, role, setShowLogin } = useContext(StoreContext);
  const navigate = useNavigate();

  const handlePrimary = () => {
    if (!token) { setShowLogin(true); return; }
    navigate(role === 'alumni' ? '/alumni' : '/student');
  };

  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-blob blob1" />
        <div className="hero-blob blob2" />
        <div className="hero-grid" />
      </div>

      <div className="hero-inner container">
        <div className="hero-content fade-up">
          <div className="hero-badge badge badge-blue">
            <Star size={12} /> Connecting Generations
          </div>
          <h1 className="hero-title">
            Build Meaningful<br />
            <span className="hero-gradient">Alumni Connections</span>
          </h1>
          <p className="hero-desc">
            Connect with alumni mentors, discover exclusive opportunities, and advance your career through a thriving community of professionals.
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={handlePrimary}>
              Get Started <ArrowRight size={18} />
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Learn More
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <Users size={18} />
              <span><strong>5K+</strong> Members</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <BookOpen size={18} />
              <span><strong>1.2K+</strong> Mentorships</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <Briefcase size={18} />
              <span><strong>300+</strong> Jobs Posted</span>
            </div>
          </div>
        </div>

        <div className="hero-visual fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="hero-card-stack">
            <div className="floating-card card1">
              <div className="fc-avatar">S</div>
              <div>
                <div className="fc-name">Sarah K.</div>
                <div className="fc-role">Software Engineer @ Google</div>
              </div>
            </div>
            <div className="hero-img-wrap">
              <img src="/logo.png" alt="ConnectAlum" className="hero-logo-img" />
              <div className="hero-ring ring1" />
              <div className="hero-ring ring2" />
            </div>
            <div className="floating-card card2">
              <div className="fc-icon">🎯</div>
              <div>
                <div className="fc-name">Mentor Match</div>
                <div className="fc-role">3 new connections</div>
              </div>
            </div>
            <div className="floating-card card3">
              <div className="fc-icon">💼</div>
              <div>
                <div className="fc-name">New Job Posted</div>
                <div className="fc-role">Frontend Dev @ Stripe</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
