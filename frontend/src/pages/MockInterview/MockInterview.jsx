import React, { useState, useEffect, useContext, useRef } from "react";
import { StoreContext } from "../../context/StoreContext";
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  ArrowRight,
  Clock,
  Award,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Send,
  HelpCircle,
  ThumbsUp,
} from "lucide-react";
import toast from "react-hot-toast";
import "./MockInterview.css";

const MockInterview = () => {
  const { axiosAuth } = useContext(StoreContext);
  const [stage, setStage] = useState("setup"); // setup | interview | scorecard
  const [role, setRole] = useState("Full Stack Developer");
  const [level, setLevel] = useState("Entry / Fresher");

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [transcript, setTranscript] = useState([]); // [{ category, question, answer }]
  const [loading, setLoading] = useState(false);
  const [scorecard, setScorecard] = useState(null);

  // Web Speech API states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Timer
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }
        if (finalTranscript) {
          setAnswer((prev) => prev + finalTranscript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      toast.error("Web Speech Recognition is not supported on this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast("Microphone stopped");
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.success("Listening... Speak your answer now.");
      } catch (e) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  };

  // Web Speech Synthesis (Text-to-Speech)
  const speakQuestion = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      toast.error("Speech Synthesis not available on browser");
    }
  };

  // Start Interview
  const handleStartInterview = async () => {
    try {
      setLoading(true);
      const res = await axiosAuth().post("/ai/mock-interview/start", { role, level });
      if (res.data.success) {
        setCurrentQuestion(res.data.currentQuestion);
        setTranscript([]);
        setStage("interview");
        setSeconds(0);
        setTimerActive(true);
        speakQuestion(res.data.currentQuestion.question);
        toast.success("AI Mock Interview session started!");
      }
    } catch {
      toast.error("Failed to start session");
    } finally {
      setLoading(false);
    }
  };

  // Submit Answer & Next Question
  const handleNextQuestion = async () => {
    if (!answer.trim()) {
      toast.error("Please provide or speak your response first");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const updatedTranscript = [
      ...transcript,
      {
        question: currentQuestion.question,
        category: currentQuestion.category,
        answer: answer.trim(),
      },
    ];
    setTranscript(updatedTranscript);
    setAnswer("");

    // If 3+ questions answered, user can finish or get next
    if (updatedTranscript.length >= 4) {
      handleFinishInterview(updatedTranscript);
      return;
    }

    try {
      setLoading(true);
      const res = await axiosAuth().post("/ai/mock-interview/next", {
        role,
        level,
        history: updatedTranscript,
      });
      if (res.data.success) {
        setCurrentQuestion(res.data.currentQuestion);
        speakQuestion(res.data.currentQuestion.question);
      }
    } catch {
      toast.error("Failed to fetch next question");
    } finally {
      setLoading(false);
    }
  };

  // Finish Interview & Generate Scorecard
  const handleFinishInterview = async (finalTranscript = transcript) => {
    setTimerActive(false);
    if (finalTranscript.length === 0) {
      toast.error("Please answer at least one question");
      return;
    }

    try {
      setLoading(true);
      const res = await axiosAuth().post("/ai/mock-interview/scorecard", {
        role,
        level,
        transcript: finalTranscript,
      });
      if (res.data.success) {
        setScorecard(res.data.scorecard);
        setStage("scorecard");
        toast.success("Performance Scorecard generated!");
      }
    } catch {
      toast.error("Failed to evaluate interview");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  };

  return (
    <div className="interview-page">
      {/* Setup Stage */}
      {stage === "setup" && (
        <div className="setup-card">
          <div className="badge-ai">
            <Sparkles size={16} /> Google Gemini 1.5 Flash Simulation Engine
          </div>
          <h1>Interactive AI Mock Interviewer & Coach</h1>
          <p>
            Simulate dynamic, role-specific technical and behavioral interviews with speech processing, adaptive follow-ups,
            and automated post-interview performance scorecards.
          </p>

          <div className="setup-form-grid">
            <div className="form-group">
              <label>Target Interview Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Full Stack Developer">Full Stack Developer (MERN / React / Node)</option>
                <option value="Frontend Developer">Frontend Developer (React, Next.js, Web Vitals)</option>
                <option value="Software Development Engineer">Software Development Engineer (DSA & Problem Solving)</option>
                <option value="Data Scientist">Data Scientist & Machine Learning</option>
                <option value="DevOps Engineer">DevOps & Cloud Systems Engineer</option>
                <option value="System Design & Architecture">System Design & Scalability</option>
              </select>
            </div>

            <div className="form-group">
              <label>Candidate Experience Tier</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="Entry / Fresher">Campus Fresher / Junior Engineer</option>
                <option value="Mid-Level">Mid-Level (1-3 Years Experience)</option>
                <option value="Senior">Senior Technical Lead</option>
              </select>
            </div>
          </div>

          <div className="features-checklist">
            <div>✓ Dynamic adaptive questions with follow-ups</div>
            <div>✓ Web Speech API (Microphone dictation + AI Voice readout)</div>
            <div>✓ Detailed scorecard: Accuracy, Logic & Conceptual Depth</div>
          </div>

          <button className="btn btn-primary start-btn" onClick={handleStartInterview} disabled={loading}>
            {loading ? "Preparing Interview Chamber..." : "Start AI Mock Interview Now"}
          </button>
        </div>
      )}

      {/* Interviewing Chamber */}
      {stage === "interview" && currentQuestion && (
        <div className="chamber-card">
          <div className="chamber-header">
            <div>
              <span className="badge-category">{currentQuestion.category}</span>
              <span className="question-count">
                Question {transcript.length + 1} of 4 • {role}
              </span>
            </div>
            <div className="timer-badge">
              <Clock size={16} /> {formatTime(seconds)}
            </div>
          </div>

          <div className="question-display-box">
            <h2>{currentQuestion.question}</h2>
            <button
              className="speak-btn"
              onClick={() => speakQuestion(currentQuestion.question)}
              title="Listen to interviewer"
            >
              <Volume2 size={18} /> Listen to Question
            </button>
          </div>

          {currentQuestion.hint && (
            <div className="hint-box">
              <HelpCircle size={16} color="#0284c7" />
              <span>
                <strong>Hint:</strong> {currentQuestion.hint}
              </span>
            </div>
          )}

          <div className="answer-input-zone">
            <div className="input-toolbar">
              <label>Your Response (Type or Speak):</label>
              <button className={`mic-button ${isListening ? "listening" : ""}`} onClick={toggleMic}>
                {isListening ? (
                  <>
                    <MicOff size={16} /> Stop Recording
                  </>
                ) : (
                  <>
                    <Mic size={16} /> Answer via Voice (Speech-to-Text)
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={8}
              placeholder="Structure your answer clearly. Mention technical mechanics, design trade-offs, and examples..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
          </div>

          <div className="chamber-actions">
            <button className="btn btn-outline" onClick={() => handleFinishInterview()} disabled={loading}>
              End Interview & View Scorecard
            </button>
            <button className="btn btn-primary" onClick={handleNextQuestion} disabled={loading}>
              {loading ? "Evaluating & Generating Next..." : "Submit Answer & Proceed"} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Scorecard Stage */}
      {stage === "scorecard" && scorecard && (
        <div className="scorecard-container">
          <div className="scorecard-header">
            <div>
              <div className="badge-ai">
                <Award size={16} /> Official Evaluation Report
              </div>
              <h1>Mock Interview Performance Scorecard</h1>
              <p>
                Role: <strong>{role}</strong> ({level}) • Duration: <strong>{formatTime(seconds)}</strong>
              </p>
            </div>
            <div className="overall-score-pill">
              <span className="big-num">{scorecard.overall_score}</span>
              <span className="den">/ 100</span>
              <div className="rec-badge">{scorecard.hiring_recommendation}</div>
            </div>
          </div>

          {/* Metrics Trio */}
          <div className="metrics-trio-grid">
            <div className="metric-box">
              <span>Technical Accuracy</span>
              <strong>{scorecard.technical_accuracy_score}%</strong>
            </div>
            <div className="metric-box">
              <span>Problem-Solving Logic</span>
              <strong>{scorecard.problem_solving_score}%</strong>
            </div>
            <div className="metric-box">
              <span>Conceptual Depth</span>
              <strong>{scorecard.conceptual_depth_score}%</strong>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="eval-split-grid">
            <div className="eval-box strengths">
              <h4>
                <CheckCircle size={18} color="#059669" /> Key Strengths
              </h4>
              <ul>
                {scorecard.strengths.map((str, i) => (
                  <li key={i}>{str}</li>
                ))}
              </ul>
            </div>
            <div className="eval-box weaknesses">
              <h4>
                <AlertTriangle size={18} color="#dc2626" /> Areas for Growth
              </h4>
              <ul>
                {scorecard.weaknesses.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Question by Question Feedback */}
          <div className="questions-review">
            <h3>Question-by-Question Evaluation & Ideal Answers</h3>
            {scorecard.question_breakdown.map((item, idx) => (
              <div key={idx} className="review-card">
                <div className="review-top">
                  <strong>
                    Q{idx + 1}: {item.question}
                  </strong>
                  <span className={`rating-pill ${item.rating?.toLowerCase().includes("strong") ? "strong" : "fair"}`}>
                    {item.rating}
                  </span>
                </div>
                <p className="eval-feedback">
                  <strong>Evaluator Feedback:</strong> {item.feedback}
                </p>
                <div className="ideal-answer-box">
                  <strong>Ideal 95th-Percentile Answer Recommendation:</strong>
                  <p>{item.ideal_answer_summary}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Next Steps Roadmap */}
          {scorecard.next_steps_roadmap && (
            <div className="roadmap-box">
              <h4>🚀 Actionable 2-Week Preparation Roadmap</h4>
              <p>{scorecard.next_steps_roadmap}</p>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <button className="btn btn-primary" onClick={() => setStage("setup")}>
              <RotateCcw size={16} /> Take Another Mock Interview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockInterview;
