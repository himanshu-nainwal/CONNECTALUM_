import React, { useState, useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  Award,
} from "lucide-react";
import toast from "react-hot-toast";
import "./ResumeAnalyzer.css";

const ResumeAnalyzer = () => {
  const { axiosAuth } = useContext(StoreContext);
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("Software Development Engineer");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [activeTab, setActiveTab] = useState("upload");

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      toast.success(`PDF selected: ${selected.name}`);
    } else {
      toast.error("Please select a valid PDF file");
    }
  };

  const handleAnalyze = async () => {
    if (!file && (!resumeText || resumeText.trim().length < 50)) {
      toast.error("Please upload a PDF resume or paste at least 50 characters of resume content");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      if (file) formData.append("resume", file);
      if (resumeText) formData.append("resumeText", resumeText);
      formData.append("targetRole", targetRole);

      const res = await axiosAuth().post("/ai/resume-analyzer", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setReport(res.data.report);
        toast.success("AI ATS Diagnostic completed!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analyzer-page">
      <div className="analyzer-hero">
        <div className="badge-ai">
          <Sparkles size={16} /> Google Gemini 1.5 Flash ATS Diagnostic Engine
        </div>
        <h1>AI Resume Diagnostic Analyzer & ATS Scoring Engine</h1>
        <p>
          Extract text from PDF resumes, evaluate ATS compatibility scores, audit action verb density, and receive
          section-by-section rewrite recommendations powered by AI.
        </p>
      </div>

      <div className="analyzer-workspace">
        {/* Left Input Pane */}
        <div className="analyzer-input-card">
          <div className="input-tabs">
            <button className={activeTab === "upload" ? "active" : ""} onClick={() => setActiveTab("upload")}>
              <UploadCloud size={16} /> Upload PDF
            </button>
            <button className={activeTab === "paste" ? "active" : ""} onClick={() => setActiveTab("paste")}>
              <FileText size={16} /> Paste Text
            </button>
          </div>

          <div className="form-group" style={{ marginTop: "16px" }}>
            <label>Target Dream Role</label>
            <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="role-dropdown">
              <option value="Software Development Engineer">Software Development Engineer (SDE)</option>
              <option value="Frontend Developer">Frontend Developer (React / Next.js)</option>
              <option value="Full Stack Developer">Full Stack Developer (MERN / Node)</option>
              <option value="Data Scientist / ML Engineer">Data Scientist / ML Engineer</option>
              <option value="DevOps & Cloud Engineer">DevOps & Cloud Engineer (AWS / Docker)</option>
              <option value="Product Manager">Product Manager</option>
            </select>
          </div>

          {activeTab === "upload" ? (
            <div className="dropzone-area">
              <input type="file" accept="application/pdf" id="pdf-input" onChange={handleFileChange} />
              <label htmlFor="pdf-input" className="dropzone-label">
                <UploadCloud size={44} className="drop-icon" />
                {file ? (
                  <div className="file-info">
                    <strong>{file.name}</strong>
                    <span>({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <>
                    <p>Click to upload or drag & drop PDF resume</p>
                    <span>Supports standard single or multi-page PDF files</span>
                  </>
                )}
              </label>
            </div>
          ) : (
            <div className="text-input-area">
              <textarea
                rows={12}
                placeholder="Paste your resume content here (Work experience, education, projects, skills)..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            </div>
          )}

          <button className="btn btn-primary w-full run-btn" onClick={handleAnalyze} disabled={loading}>
            {loading ? (
              <>
                <Cpu size={18} className="spin" /> Running Gemini Diagnostic...
              </>
            ) : (
              <>
                <Sparkles size={18} /> Analyze Resume & Generate Scorecard
              </>
            )}
          </button>
        </div>

        {/* Right Results Pane */}
        <div className="analyzer-report-card">
          {!report ? (
            <div className="empty-report-state">
              <Layers size={48} color="#94a3b8" />
              <h3>No Analysis Generated Yet</h3>
              <p>Upload a PDF or paste resume text on the left and trigger the diagnostic to receive your comprehensive ATS report.</p>
            </div>
          ) : (
            <div className="report-content">
              {/* Score Header */}
              <div className="score-summary-header">
                <div className="overall-score-gauge">
                  <div className="score-circle">
                    <span className="number">{report.overall_ats_score}</span>
                    <span className="label">/ 100</span>
                  </div>
                  <div className="score-meta">
                    <h3>Overall ATS Compatibility</h3>
                    <p>
                      {report.overall_ats_score >= 80
                        ? "🎉 Highly ATS Optimized! Ready for corporate job referral pipelines."
                        : "⚠️ Moderate ATS Risk. Follow the rewrite recommendations below to pass screeners."}
                    </p>
                  </div>
                </div>

                <div className="sub-scores-grid">
                  <div className="sub-score-box">
                    <span>Formatting & Structure</span>
                    <strong>{report.formatting_score}%</strong>
                  </div>
                  <div className="sub-score-box">
                    <span>Action Verb Density</span>
                    <strong>{report.action_verbs_score}%</strong>
                  </div>
                  <div className="sub-score-box">
                    <span>Quantifiable Metrics</span>
                    <strong>{report.metric_density_score}%</strong>
                  </div>
                </div>
              </div>

              {/* Skill Gap Analysis */}
              <div className="report-section">
                <h4>
                  <Award size={18} /> Skill Gap Analysis for {report.target_role}
                </h4>
                <div className="skills-split">
                  <div>
                    <span className="skills-sublabel green">✓ Matched In Resume:</span>
                    <div className="skill-pills">
                      {report.skill_gap_analysis.identified_skills.map((s, idx) => (
                        <span key={idx} className="pill matched">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="skills-sublabel orange">⚠️ Missing In-Demand Keywords:</span>
                    <div className="skill-pills">
                      {report.skill_gap_analysis.missing_in_demand_skills.map((s, idx) => (
                        <span key={idx} className="pill missing">
                          + {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths & Critical Improvements */}
              <div className="critique-grid">
                <div className="critique-col strengths">
                  <h4>
                    <CheckCircle2 size={16} color="#059669" /> Key Strengths
                  </h4>
                  <ul>
                    {report.strengths.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>
                <div className="critique-col improvements">
                  <h4>
                    <AlertCircle size={16} color="#dc2626" /> Critical Improvements
                  </h4>
                  <ul>
                    {report.critical_improvements.map((imp, i) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Section-by-Section Rewrite Suggestions */}
              {report.section_rewrites && (
                <div className="report-section rewrite-box">
                  <h4>
                    <Sparkles size={18} /> Section-by-Section Rewrite Suggestions
                  </h4>

                  {report.section_rewrites.summary && (
                    <div className="rewrite-item">
                      <strong>Recommended Professional Summary:</strong>
                      <p className="suggested-text">{report.section_rewrites.summary}</p>
                    </div>
                  )}

                  {report.section_rewrites.experience_bullet_examples && (
                    <div className="rewrite-item">
                      <strong>STAR-Method Experience Bullet Rewrites:</strong>
                      <ul>
                        {report.section_rewrites.experience_bullet_examples.map((bullet, idx) => (
                          <li key={idx} className="bullet-rewrite">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {report.section_rewrites.skills_organization_tip && (
                    <div className="rewrite-item">
                      <strong>Skills Architecture Tip:</strong>
                      <p>{report.section_rewrites.skills_organization_tip}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
