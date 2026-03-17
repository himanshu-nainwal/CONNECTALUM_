import React, { useEffect, useRef, useState } from "react";
import "./StatesSection.css";

const stats = [
  { value: 5000, suffix: "+", label: "Active Members" },
  { value: 1200, suffix: "+", label: "Mentorships" },
  { value: 300, suffix: "+", label: "Jobs Posted" },
  { value: 50, suffix: "+", label: "Universities" },
];

function useCounter(target, duration = 1500, active) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0; const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, active]);
  return count;
}

const StatItem = ({ value, suffix, label }) => {
  const [active, setActive] = useState(false);
  const ref = useRef();
  const count = useCounter(value, 1500, active);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActive(true); }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="stat-item">
      <div className="stat-number">{count.toLocaleString()}{suffix}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

const StatesSection = () => (
  <section className="stats-section">
    <div className="container">
      <div className="stats-grid">
        {stats.map((s, i) => <StatItem key={i} {...s} />)}
      </div>
    </div>
  </section>
);

export default StatesSection;
