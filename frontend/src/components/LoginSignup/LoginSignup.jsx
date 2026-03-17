import React, { useContext, useState, useEffect } from "react";
import { StoreContext } from "../../context/StoreContext";
import { X, Eye, EyeOff, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./LoginSignup.css";

const LoginSignup = ({ setShowLogin }) => {
  const { login, register } = useContext(StoreContext);
  const [mode, setMode] = useState("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [data, setData] = useState({ name: "", email: "", password: "", role: "student" });

  useEffect(() => {
    document.body.classList.add("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, []);

  const onChange = (e) => setData({ ...data, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let result;
    if (mode === "login") {
      result = await login(data.email, data.password);
    } else {
      result = await register(data.name, data.email, data.password, data.role);
    }
    setLoading(false);
    if (result.success) {
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
      setShowLogin(false);
      navigate(data.role === 'alumni' ? '/alumni' : '/student');
    } else {
      toast.error(result.message || "Something went wrong");
    }
  };

  return (
    <div className="auth-overlay" onClick={() => setShowLogin(false)}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-close" onClick={() => setShowLogin(false)} aria-label="Close">
          <X size={20} />
        </button>

        <div className="auth-header">
          <div className="auth-logo"><GraduationCap size={28} /></div>
          <h2>{mode === "login" ? "Welcome back" : "Create account"}</h2>
          <p>{mode === "login" ? "Sign in to your ConnectAlum account" : "Join the ConnectAlum community"}</p>
        </div>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign In</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Sign Up</button>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          {mode === "signup" && (
            <div className="form-group">
              <label>Full Name</label>
              <input className="input" name="name" type="text" placeholder="Your full name"
                value={data.name} onChange={onChange} required />
            </div>
          )}
          <div className="form-group">
            <label>Email Address</label>
            <input className="input" name="email" type="email" placeholder="you@example.com"
              value={data.email} onChange={onChange} required autoComplete="email" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="pass-wrap">
              <input className="input" name="password" type={showPass ? "text" : "password"}
                placeholder={mode === "signup" ? "Min 8 characters" : "Your password"}
                value={data.password} onChange={onChange} required
                autoComplete={mode === "signup" ? "new-password" : "current-password"} />
              <button type="button" className="show-pass" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === "signup" && (
            <div className="form-group">
              <label>I am a...</label>
              <div className="role-picker">
                <button type="button" className={`role-btn ${data.role === 'student' ? 'active' : ''}`}
                  onClick={() => setData({ ...data, role: 'student' })}>
                  🎓 Student
                </button>
                <button type="button" className={`role-btn ${data.role === 'alumni' ? 'active' : ''}`}
                  onClick={() => setData({ ...data, role: 'alumni' })}>
                  💼 Alumni
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Please wait..." : (mode === "login" ? "Sign In" : "Create Account")}
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
