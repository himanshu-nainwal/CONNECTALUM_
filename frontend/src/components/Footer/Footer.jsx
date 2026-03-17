import React from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Twitter, Linkedin, Github, Mail } from "lucide-react";
import "./Footer.css";

const Footer = () => (
  <footer className="footer" id="contact">
    <div className="container">
      <div className="footer-grid">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <GraduationCap size={22} /> ConnectAlum
          </Link>
          <p>Bridging the gap between students and alumni professionals worldwide.</p>
          <div className="footer-socials">
            <a href="#" aria-label="Twitter"><Twitter size={18} /></a>
            <a href="#" aria-label="LinkedIn"><Linkedin size={18} /></a>
            <a href="#" aria-label="GitHub"><Github size={18} /></a>
            <a href="#" aria-label="Email"><Mail size={18} /></a>
          </div>
        </div>
        <div className="footer-links">
          <h4>Platform</h4>
          <Link to="/student">Student Portal</Link>
          <Link to="/alumni">Alumni Portal</Link>
          <Link to="/chat">Community</Link>
        </div>
        <div className="footer-links">
          <h4>Company</h4>
          <a href="#">About Us</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>Made By Himanshu Nainwal @2025.</p>
      </div>
    </div>
  </footer>
);
export default Footer;
