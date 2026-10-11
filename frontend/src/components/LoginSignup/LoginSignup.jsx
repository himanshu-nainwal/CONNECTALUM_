import React, { useContext, useState, useEffect } from "react";
import { StoreContext } from "../../context/StoreContext";
import { X, Eye, EyeOff, GraduationCap, ShieldCheck, Mail, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./LoginSignup.css";

const LoginSignup = ({ setShowLogin }) => {
  const { login, register, sendOtp } = useContext(StoreContext);
  const [mode, setMode] = useState("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState("");
  const navigate = useNavigate();

  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    otp: "",
    batch: 2026,
    department: "Computer Science & Engineering",
  });

  useEffect(() => {
    document.body.classList.add("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, []);

  const onChange = (e) => setData({ ...data, [e.target.name]: e.target.value });

  const handleSendOtp = async () => {
    if (!data.email) {
      toast.error("Please enter your institutional email first");
      return;
    }
    setOtpLoading(true);
    const res = await sendOtp(data.email);
    setOtpLoading(false);
    if (res.success) {
      setOtpSent(true);
      toast.success(res.message || "6-Digit OTP sent to email!");
      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
      }
    } else {
      toast.error(res.message || "Failed to send OTP. Check whitelist status.");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let result;
    if (mode === "login") {
      result = await login(data.email, data.password);
    } else {
      result = await register({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        otp: data.otp,
        batch: data.batch,
        department: data.department,
      });
    }
    setLoading(false);
    if (result.success) {
      toast.success(mode === "login" ? "Welcome back to ConnectAlum!" : "Account created successfully!");
      setShowLogin(false);
      if (data.role === "admin" || data.role === "master_admin") navigate("/admin");
      else if (data.role === "alumni") navigate("/alumni");
      else navigate("/student");
    } else {
      toast.error(result.message || "Authentication failed");
    }
  };

  return (
    <div className="auth-overlay" onClick={() => setShowLogin(false)}>
      <div className="auth-modal" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={() => setShowLogin(false)} aria-label="Close">
          <X size={20} />
        </button>

        <div className="auth-header">
          <div className="auth-logo">
            <GraduationCap size={28} />
          </div>
          <h2>{mode === "login" ? "Welcome back" : "Create Account"}</h2>
          <p>
            {mode === "login"
              ? "Sign in with your verified ConnectAlum credentials"
              : "Pre-stored Institutional Whitelist & OTP Protected Access"}
          </p>
        </div>

        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Sign In
          </button>
          <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
            Sign Up
          </button>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          {mode === "signup" && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                className="input"
                name="name"
                type="text"
                placeholder="e.g. Himanshu Nainwal"
                value={data.name}
                onChange={onChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Institutional Email</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                className="input"
                name="email"
                type="email"
                placeholder="you@gehu.ac.in"
                value={data.email}
                onChange={onChange}
                required
                autoComplete="email"
                style={{ flex: 1 }}
              />
              {mode === "signup" && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleSendOtp}
                  disabled={otpLoading || !data.email}
                  style={{ whiteSpace: "nowrap", padding: "0 12px", fontSize: "0.85rem" }}
                >
                  {otpLoading ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
                </button>
              )}
            </div>
            {devOtpHint && mode === "signup" && (
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "#059669",
                  background: "#ecfdf5",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  marginTop: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <KeyRound size={14} /> Dev OTP Code: <strong>{devOtpHint}</strong> (auto-filled ready)
              </div>
            )}
          </div>

          {mode === "signup" && (
            <div className="form-group">
              <label>6-Digit Email Verification Code (OTP)</label>
              <input
                className="input"
                name="otp"
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit code received"
                value={data.otp}
                onChange={onChange}
              />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <div className="pass-wrap">
              <input
                className="input"
                name="password"
                type={showPass ? "text" : "password"}
                placeholder={mode === "signup" ? "Min 8 characters" : "Your password"}
                value={data.password}
                onChange={onChange}
                required
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
              <button type="button" className="show-pass" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === "signup" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label>Graduation Batch</label>
                  <select className="input" name="batch" value={data.batch} onChange={onChange}>
                    <option value={2024}>Batch 2024</option>
                    <option value={2025}>Batch 2025</option>
                    <option value={2026}>Batch 2026</option>
                    <option value={2027}>Batch 2027</option>
                    <option value={2028}>Batch 2028</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select className="input" name="department" value={data.department} onChange={onChange}>
                    <option value="Computer Science & Engineering">CSE</option>
                    <option value="Information Technology">IT</option>
                    <option value="Electronics & Communication">ECE</option>
                    <option value="Mechanical Engineering">ME</option>
                    <option value="Management Studies">MBA</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Institutional Role (RBAC)</label>
                <div className="role-picker" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  <button
                    type="button"
                    className={`role-btn ${data.role === "student" ? "active" : ""}`}
                    onClick={() => setData({ ...data, role: "student" })}
                  >
                    🎓 Student
                  </button>
                  <button
                    type="button"
                    className={`role-btn ${data.role === "alumni" ? "active" : ""}`}
                    onClick={() => setData({ ...data, role: "alumni" })}
                  >
                    💼 Alumni
                  </button>
                  <button
                    type="button"
                    className={`role-btn ${data.role === "admin" ? "active" : ""}`}
                    onClick={() => setData({ ...data, role: "admin" })}
                  >
                    🛡️ Admin
                  </button>
                  <button
                    type="button"
                    className={`role-btn ${data.role === "master_admin" ? "active" : ""}`}
                    onClick={() => setData({ ...data, role: "master_admin" })}
                  >
                    ⚡ Master Admin
                  </button>
                </div>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: "10px" }}>
            {loading ? "Processing..." : mode === "login" ? "Sign In" : "Register with Whitelist Check"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginSignup;
