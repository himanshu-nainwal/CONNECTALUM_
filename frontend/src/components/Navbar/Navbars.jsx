import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import {
  GraduationCap,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  MessageCircle,
  Users,
  BookOpen,
  Network,
  Sparkles,
  Bot,
  HelpCircle,
  ShieldAlert,
  Award,
} from "lucide-react";
import "./Navbar.css";

const Navbar = ({ setShowLogin }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { token, role, user, logout } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/");
  };
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo">
            <GraduationCap size={24} />
            <span>ConnectAlum</span>
          </Link>

          <div className={`navbar-links ${mobileOpen ? "open" : ""}`}>
            <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
              Home
            </Link>
            {role === "student" && (
              <Link to="/student" className={`nav-link ${isActive("/student") ? "active" : ""}`}>
                Student Portal
              </Link>
            )}
            {role === "alumni" && (
              <Link to="/alumni" className={`nav-link ${isActive("/alumni") ? "active" : ""}`}>
                Alumni Portal
              </Link>
            )}

            {/* AI Engines Navigation */}
            <Link to="/resume-analyzer" className={`nav-link ${isActive("/resume-analyzer") ? "active" : ""}`}>
              <Sparkles size={14} style={{ marginRight: 2 }} /> AI ATS Analyzer
            </Link>
            <Link to="/mock-interview" className={`nav-link ${isActive("/mock-interview") ? "active" : ""}`}>
              <Bot size={14} style={{ marginRight: 2 }} /> AI Mock Coach
            </Link>

            <Link to="/qna" className={`nav-link ${isActive("/qna") ? "active" : ""}`}>
              Q&A Forum
            </Link>
            <Link to="/stories" className={`nav-link ${isActive("/stories") ? "active" : ""}`}>
              Alumni Stories
            </Link>
            <Link to="/chat" className={`nav-link ${isActive("/chat") ? "active" : ""}`}>
              Chatrooms
            </Link>

            {token && (
              <Link to="/messages" className={`nav-link ${isActive("/messages") ? "active" : ""}`}>
                Messages
              </Link>
            )}

            {(role === "admin" || role === "master_admin") && (
              <Link
                to="/admin"
                className={`nav-link ${isActive("/admin") ? "active" : ""}`}
                style={{ color: "#be123c", fontWeight: 700 }}
              >
                <ShieldAlert size={14} style={{ marginRight: 2 }} /> Admin
              </Link>
            )}

            <div className="mobile-auth">
              {!token ? (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowLogin(true);
                    setMobileOpen(false);
                  }}
                >
                  Sign In
                </button>
              ) : (
                <button className="btn btn-outline" onClick={handleLogout}>
                  Sign Out
                </button>
              )}
            </div>
          </div>

          <div className="navbar-actions">
            {!token ? (
              <button className="btn btn-primary btn-sm" onClick={() => setShowLogin(true)}>
                Sign In
              </button>
            ) : (
              <div className="profile-menu" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <div className="avatar">{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
                <ChevronDown size={14} className={`chevron ${dropdownOpen ? "rotated" : ""}`} />
                {dropdownOpen && (
                  <div className="profile-dropdown" onClick={(e) => e.stopPropagation()}>
                    <div className="dropdown-header">
                      <span className="dropdown-name">{user?.name || "User"}</span>
                      <span className="dropdown-role badge badge-blue">{role}</span>
                    </div>
                    <hr />
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setDropdownOpen(false);
                      }}
                    >
                      <User size={15} /> Verified Profile
                    </button>
                    {(role === "admin" || role === "master_admin") && (
                      <button
                        onClick={() => {
                          navigate("/admin");
                          setDropdownOpen(false);
                        }}
                      >
                        <ShieldAlert size={15} color="#be123c" /> Admin Governance
                      </button>
                    )}
                    <button
                      onClick={() => {
                        navigate("/resume-analyzer");
                        setDropdownOpen(false);
                      }}
                    >
                      <Sparkles size={15} /> AI Resume Analyzer
                    </button>
                    <button
                      onClick={() => {
                        navigate("/mock-interview");
                        setDropdownOpen(false);
                      }}
                    >
                      <Bot size={15} /> AI Mock Interview
                    </button>
                    <button
                      onClick={() => {
                        navigate("/connections");
                        setDropdownOpen(false);
                      }}
                    >
                      <Network size={15} /> My Network
                    </button>
                    <button
                      onClick={() => {
                        navigate("/messages");
                        setDropdownOpen(false);
                      }}
                    >
                      <MessageCircle size={15} /> Direct Messages
                    </button>
                    <button
                      onClick={() => {
                        navigate("/stories");
                        setDropdownOpen(false);
                      }}
                    >
                      <Award size={15} /> Alumni Stories
                    </button>
                    <button
                      onClick={() => {
                        navigate("/resources");
                        setDropdownOpen(false);
                      }}
                    >
                      <BookOpen size={15} /> Resource Library
                    </button>
                    <hr />
                    <button className="danger" onClick={handleLogout}>
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
            <button className="nav-hamburger btn btn-ghost btn-sm" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}
      {dropdownOpen && <div className="dropdown-overlay" onClick={() => setDropdownOpen(false)} />}
    </>
  );
};
export default Navbar;
