import React from "react";
import { Search, Users, Briefcase, MessageSquare, Calendar, GitBranch } from "lucide-react";
import "./Features.css";

const features = [
  { icon: Search, title: "Alumni Directory", desc: "Search alumni by industry, graduation year, location & expertise.", color: "#2563eb" },
  { icon: Users, title: "Mentorship Matching", desc: "Smart pairing of students with alumni mentors based on goals.", color: "#7c3aed" },
  { icon: Briefcase, title: "Exclusive Jobs", desc: "Job & internship opportunities posted by alumni and partners.", color: "#059669" },
  { icon: MessageSquare, title: "Community Chat", desc: "Real-time chat rooms for networking and knowledge sharing.", color: "#d97706" },
  { icon: Calendar, title: "Event Management", desc: "Organize and join virtual events, webinars, and reunions.", color: "#dc2626" },
  { icon: GitBranch, title: "Collaboration", desc: "Work on real projects with students and alumni globally.", color: "#0891b2" },
];

const Features = () => (
  <section id="features" className="features-section">
    <div className="container">
      <div className="section-header">
        <h2>Everything You Need to Grow</h2>
        <p>A comprehensive platform bridging the gap between students and alumni professionals.</p>
      </div>
      <div className="features-grid">
        {features.map(({ icon: Icon, title, desc, color }, i) => (
          <div key={i} className="feature-card card">
            <div className="feature-icon-wrap" style={{ background: `${color}15` }}>
              <Icon size={22} style={{ color }} />
            </div>
            <h3>{title}</h3>
            <p>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
