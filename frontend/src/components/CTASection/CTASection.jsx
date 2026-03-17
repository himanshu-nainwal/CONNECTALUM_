import React, { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import { ArrowRight } from "lucide-react";
import "./CTASection.css";

const CTASection = () => {
  const { setShowLogin, token } = useContext(StoreContext);
  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-card">
          <div className="cta-content">
            <h2>Ready to Build Your Network?</h2>
            <p>Join thousands of students and alumni already connecting on our platform.</p>
            {!token && (
              <button className="btn btn-primary btn-lg" onClick={() => setShowLogin(true)}>
                Join ConnectAlum <ArrowRight size={18} />
              </button>
            )}
          </div>
          <div className="cta-decoration">
            <div className="cta-circle c1" />
            <div className="cta-circle c2" />
          </div>
        </div>
      </div>
    </section>
  );
};
export default CTASection;
