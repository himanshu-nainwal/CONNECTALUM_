import React, { useState, useContext, useRef, useEffect } from "react";
import { StoreContext } from "../../context/StoreContext";
import { MessageSquare, X, Send, Bot, Sparkles, User, Minimize2 } from "lucide-react";
import "./CareerChatbot.css";

const CareerChatbot = () => {
  const { axiosAuth, user } = useContext(StoreContext);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "👋 Hi! I am your 24/7 AI Career Guidance Counselor. Ask me about alumni referrals, company interview prep, career transitions, or resume ATS tips!",
    },
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (customText) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const newMsgs = [...messages, { sender: "user", text: textToSend.trim() }];
    setMessages(newMsgs);
    if (!customText) setInput("");
    setLoading(true);

    try {
      const res = await axiosAuth().post("/ai/career-chat", {
        message: textToSend.trim(),
        chatHistory: newMsgs.slice(-6),
      });

      if (res.data.success) {
        setMessages([...newMsgs, { sender: "ai", text: res.data.reply }]);
      }
    } catch {
      setMessages([
        ...newMsgs,
        {
          sender: "ai",
          text: "I am having trouble reaching the career server right now. Try browsing our verified alumni directory or review interview experiences in Resources!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPills = [
    "How do I request an alumni referral?",
    "Top 5 interview prep tips for freshers",
    "How does the AI Resume Analyzer score ATS?",
  ];

  return (
    <div className="career-chatbot-wrapper">
      {!isOpen && (
        <button className="chatbot-launcher-btn" onClick={() => setIsOpen(true)} title="AI Career Guidance Chatbot">
          <Bot size={24} />
          <span className="pulse-dot"></span>
        </button>
      )}

      {isOpen && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div className="header-info">
              <Bot size={22} className="bot-head-icon" />
              <div>
                <h4>24/7 AI Career Counselor</h4>
                <span>Gemini 1.5 Flash • Online</span>
              </div>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <Minimize2 size={18} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((m, idx) => (
              <div key={idx} className={`chat-bubble-row ${m.sender}`}>
                <div className="avatar-tag">{m.sender === "ai" ? <Bot size={14} /> : <User size={14} />}</div>
                <div className="chat-bubble">
                  {m.text.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-bubble-row ai">
                <div className="avatar-tag">
                  <Bot size={14} />
                </div>
                <div className="chat-bubble typing-dots">
                  <span>●</span>
                  <span>●</span>
                  <span>●</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length < 3 && (
            <div className="quick-pills-row">
              {quickPills.map((pill, i) => (
                <button key={i} className="quick-pill" onClick={() => handleSend(pill)}>
                  {pill}
                </button>
              ))}
            </div>
          )}

          <form
            className="chatbot-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              placeholder="Ask career or referral advice..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={!input.trim() || loading}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CareerChatbot;
