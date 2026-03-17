import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import { GraduationCap, Menu, X, User, LogOut, ChevronDown, MessageCircle, Users, BookOpen, Network } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ setShowLogin }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { token, role, user, logout } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); setDropdownOpen(false); navigate('/'); };
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo">
            <GraduationCap size={24} />
            <span>ConnectAlum</span>
          </Link>

          <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
            {role === 'student' && <Link to="/student" className={`nav-link ${isActive('/student') ? 'active' : ''}`}>Student Portal</Link>}
            {role === 'alumni' && <Link to="/alumni" className={`nav-link ${isActive('/alumni') ? 'active' : ''}`}>Alumni Portal</Link>}
            <Link to="/resources" className={`nav-link ${isActive('/resources') ? 'active' : ''}`}>Resources</Link>
            <Link to="/communities" className={`nav-link ${isActive('/communities') ? 'active' : ''}`}>Communities</Link>
            <Link to="/chat" className={`nav-link ${isActive('/chat') ? 'active' : ''}`}>Community Chat</Link>
            {token && <Link to="/connections" className={`nav-link ${isActive('/connections') ? 'active' : ''}`}>My Network</Link>}
            {token && <Link to="/messages" className={`nav-link ${isActive('/messages') ? 'active' : ''}`}>Messages</Link>}

            <div className="mobile-auth">
              {!token ? (
                <button className="btn btn-primary" onClick={() => { setShowLogin(true); setMobileOpen(false); }}>Sign In</button>
              ) : (
                <button className="btn btn-outline" onClick={handleLogout}>Sign Out</button>
              )}
            </div>
          </div>

          <div className="navbar-actions">
            {!token ? (
              <button className="btn btn-primary btn-sm" onClick={() => setShowLogin(true)}>Sign In</button>
            ) : (
              <div className="profile-menu" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <div className="avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                <ChevronDown size={14} className={`chevron ${dropdownOpen ? 'rotated' : ''}`} />
                {dropdownOpen && (
                  <div className="profile-dropdown" onClick={e => e.stopPropagation()}>
                    <div className="dropdown-header">
                      <span className="dropdown-name">{user?.name || 'User'}</span>
                      <span className="dropdown-role badge badge-blue">{role}</span>
                    </div>
                    <hr />
                    <button onClick={() => { navigate('/profile'); setDropdownOpen(false); }}><User size={15} /> Edit Profile</button>
                    {role === 'student' && <button onClick={() => { navigate('/student'); setDropdownOpen(false); }}><GraduationCap size={15} /> Student Portal</button>}
                    {role === 'alumni' && <button onClick={() => { navigate('/alumni'); setDropdownOpen(false); }}><GraduationCap size={15} /> Alumni Portal</button>}
                    <button onClick={() => { navigate('/connections'); setDropdownOpen(false); }}><Network size={15} /> My Network</button>
                    <button onClick={() => { navigate('/messages'); setDropdownOpen(false); }}><MessageCircle size={15} /> Messages</button>
                    <button onClick={() => { navigate('/resources'); setDropdownOpen(false); }}><BookOpen size={15} /> Resources</button>
                    <button onClick={() => { navigate('/communities'); setDropdownOpen(false); }}><Users size={15} /> Communities</button>
                    <hr />
                    <button className="danger" onClick={handleLogout}><LogOut size={15} /> Sign Out</button>
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
