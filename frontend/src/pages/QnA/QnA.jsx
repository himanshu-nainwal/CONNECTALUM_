import React, { useState, useEffect, useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import {
  HelpCircle,
  Search,
  MessageCircle,
  ThumbsUp,
  CheckCircle2,
  Sparkles,
  Award,
  Plus,
  Send,
  Eye,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import "./QnA.css";

const QnA = () => {
  const { axiosAuth, user, token } = useContext(StoreContext);
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showAskModal, setShowAskModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTags, setNewTags] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchQuestions = async () => {
    try {
      const res = await axiosAuth().get("/qna", { params: { search } });
      if (res.data.success) {
        setQuestions(res.data.questions);
      }
    } catch {}
  };

  useEffect(() => {
    fetchQuestions();
  }, [search]);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Please sign in to post questions");
      return;
    }
    if (!newTitle.trim() || !newDesc.trim()) return;

    try {
      setLoading(true);
      const res = await axiosAuth().post("/qna", {
        title: newTitle.trim(),
        description: newDesc.trim(),
        tags: newTags,
      });

      if (res.data.success) {
        toast.success("Question posted with instant AI draft answer!");
        setShowAskModal(false);
        setNewTitle("");
        setNewDesc("");
        setNewTags("");
        fetchQuestions();
        setSelectedQuestion(res.data.question);
      }
    } catch {
      toast.error("Failed to post question");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnswer = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Please sign in to answer");
      return;
    }
    if (!answerText.trim() || !selectedQuestion) return;

    try {
      const res = await axiosAuth().post(`/qna/${selectedQuestion.id || selectedQuestion._id}/answers`, {
        text: answerText.trim(),
      });
      if (res.data.success) {
        toast.success("Answer submitted successfully!");
        setAnswerText("");
        setSelectedQuestion(res.data.question);
        fetchQuestions();
      }
    } catch {
      toast.error("Failed to submit answer");
    }
  };

  const handleUpvoteQuestion = async (qId) => {
    if (!token) {
      toast.error("Sign in to upvote");
      return;
    }
    try {
      const res = await axiosAuth().post(`/qna/${qId}/upvote`);
      if (res.data.success) {
        fetchQuestions();
        if (selectedQuestion) {
          setSelectedQuestion((prev) => ({
            ...prev,
            upvotes: res.data.upvoted
              ? [...(prev.upvotes || []), user?._id]
              : (prev.upvotes || []).filter((id) => id !== user?._id),
          }));
        }
      }
    } catch {}
  };

  const handleAcceptAnswer = async (qId, ansId) => {
    try {
      const res = await axiosAuth().patch(`/qna/${qId}/answers/${ansId}/accept`);
      if (res.data.success) {
        toast.success("Marked as accepted answer!");
        setSelectedQuestion(res.data.question);
        fetchQuestions();
      }
    } catch {
      toast.error("Failed to accept answer");
    }
  };

  return (
    <div className="qna-page">
      <div className="qna-header">
        <div>
          <div className="badge-qna">
            <Sparkles size={16} /> Instant AI Draft Answers + Verified Alumni Insights
          </div>
          <h1>Community Q&A & Academic Forum</h1>
          <p>Ask technical questions, get instant AI drafts, and receive answers from verified alumni in the industry.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAskModal(true)}>
          <Plus size={18} /> Ask a Question
        </button>
      </div>

      <div className="qna-search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search questions or duplicate topics (e.g., MERN architecture, DSA graphs, referrals)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="qna-layout">
        {/* Questions list */}
        <div className="questions-feed">
          {questions.map((q) => (
            <div
              key={q.id || q._id}
              className={`question-card ${selectedQuestion?._id === (q.id || q._id) ? "selected" : ""}`}
              onClick={() => setSelectedQuestion(q)}
            >
              <div className="card-upvotes">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpvoteQuestion(q.id || q._id);
                  }}
                >
                  <ThumbsUp size={14} />
                  <span>{q.upvotes?.length || q.upvoteCount || 0}</span>
                </button>
              </div>
              <div className="card-main">
                <div className="q-title-row">
                  <h3>{q.title}</h3>
                  {q.is_solved && (
                    <span className="badge-solved">
                      <CheckCircle2 size={12} /> Solved
                    </span>
                  )}
                </div>
                <p>{q.description.slice(0, 140)}...</p>
                <div className="card-meta">
                  <div className="meta-tags">
                    {q.tags?.map((t, idx) => (
                      <span key={idx} className="tag-pill">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <div className="meta-author">
                    <span>
                      by <strong>{q.author?.name}</strong> • {q.answers?.length || 0} answers
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Question Detail View */}
        <div className="question-detail-pane">
          {!selectedQuestion ? (
            <div className="select-prompt">
              <HelpCircle size={40} color="#94a3b8" />
              <p>Select any discussion on the left to read answers or post your reply.</p>
            </div>
          ) : (
            <div className="detail-card">
              <div className="detail-header">
                <h2>{selectedQuestion.title}</h2>
                <div className="detail-meta">
                  <span>Asked by {selectedQuestion.author?.name}</span>
                  <span>{selectedQuestion.views} views</span>
                </div>
              </div>

              <div className="detail-description">{selectedQuestion.description}</div>

              {/* Instant AI Draft Answer Banner */}
              {selectedQuestion.ai_draft_answer && (
                <div className="ai-draft-box">
                  <div className="ai-draft-header">
                    <Sparkles size={16} color="#7c3aed" />
                    <strong>Instant AI Draft Answer (Gemini 1.5 Flash):</strong>
                  </div>
                  <div className="ai-draft-body">
                    {selectedQuestion.ai_draft_answer.split("\n").map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Verified Answers Section */}
              <div className="answers-section">
                <h3>
                  Answers ({selectedQuestion.answers?.length || 0})
                </h3>

                {selectedQuestion.answers?.map((ans, idx) => (
                  <div key={idx} className={`answer-card ${ans.is_accepted ? "accepted-card" : ""}`}>
                    <div className="ans-header">
                      <div className="ans-author">
                        <strong>{ans.author?.name}</strong>
                        {ans.is_verified_alumni && (
                          <span className="badge-alumni-verified">
                            <Award size={12} /> Verified Alumni ({ans.author?.company || "Tech Alum"})
                          </span>
                        )}
                        {ans.is_accepted && (
                          <span className="badge-accepted">
                            <CheckCircle2 size={14} /> Accepted Answer
                          </span>
                        )}
                      </div>
                      {user?._id === selectedQuestion.author?._id && !ans.is_accepted && (
                        <button
                          className="btn btn-sm btn-outline accept-btn"
                          onClick={() => handleAcceptAnswer(selectedQuestion._id, ans._id)}
                        >
                          Mark Accepted
                        </button>
                      )}
                    </div>
                    <div className="ans-body">{ans.text}</div>
                  </div>
                ))}

                {/* Submit New Answer */}
                <form onSubmit={handleAddAnswer} className="submit-answer-form">
                  <label>Your Answer / Alumni Insight:</label>
                  <textarea
                    rows={4}
                    placeholder="Contribute your solution or explanation..."
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" disabled={!answerText.trim()}>
                    <Send size={15} /> Submit Answer
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ask Question Modal */}
      {showAskModal && (
        <div className="modal-overlay" onClick={() => setShowAskModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Ask in Community Q&A Forum</h2>
            <p>Our AI will immediately generate a draft answer, followed by answers from verified alumni.</p>
            <form onSubmit={handleAskQuestion}>
              <div className="form-group">
                <label>Question Title</label>
                <input
                  type="text"
                  placeholder="e.g. How does MongoDB Atlas Vector Search calculate Cosine Similarity?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Details & Context</label>
                <textarea
                  rows={6}
                  placeholder="Explain what you are trying to achieve and any error or scenario details..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. vector-search, mongodb, gemini, cse"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowAskModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Generating Draft..." : "Post Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QnA;
