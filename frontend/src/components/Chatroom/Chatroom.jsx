import React, { useState, useEffect, useRef, useContext } from "react";
import { io } from "socket.io-client";
import { StoreContext } from "../../context/StoreContext";
import { Send, Hash, Users, ShieldAlert, Award, GraduationCap } from "lucide-react";
import config from "../../config";
import "./Chatroom.css";

const ROOMS = [
  { id: "general", name: "general", label: "#general", icon: "💬" },
  { id: "jobs", name: "jobs", label: "#jobs", icon: "💼" },
  { id: "tech-talk", name: "tech-talk", label: "#tech-talk", icon: "⚡" },
  { id: "events", name: "events", label: "#events", icon: "📅" },
];

const Chatroom = () => {
  const { user, role, token, setShowLogin } = useContext(StoreContext);
  const [socket, setSocket] = useState(null);
  const [activeRoom, setActiveRoom] = useState("general");
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [presence, setPresence] = useState({}); // room -> { count, users }
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const sock = io(config.SOCKET_URL || "http://localhost:4000", {
      transports: ["websocket", "polling"],
    });

    sock.on("connect", () => setConnected(true));
    sock.on("disconnect", () => setConnected(false));

    sock.on("chat_history", (history) => {
      setMessages((prev) => ({ ...prev, [activeRoom]: history }));
    });

    sock.on("receive_message", (msg) => {
      setMessages((prev) => ({
        ...prev,
        [msg.room]: [...(prev[msg.room] || []), msg],
      }));
    });

    sock.on("room_presence", (data) => {
      setPresence((prev) => ({
        ...prev,
        [data.room]: data,
      }));
    });

    setSocket(sock);
    return () => sock.disconnect();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.emit("join_room", {
        room: activeRoom,
        user: { name: user?.name || "Guest", role: role || "student" },
      });
      if (!messages[activeRoom]) setMessages((prev) => ({ ...prev, [activeRoom]: [] }));
    }
  }, [activeRoom, socket, user, role]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages[activeRoom]]);

  const sendMessage = () => {
    if (!token) {
      setShowLogin(true);
      return;
    }
    if (!input.trim() || !socket) return;
    socket.emit("send_message", {
      user: user?.name || "Scholar",
      role: role || "student",
      text: input.trim(),
      room: activeRoom,
    });
    setInput("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentPresence = presence[activeRoom]?.count || 1;
  const roomMessages = messages[activeRoom] || [];

  return (
    <div className="chat-layout">
      {/* Sidebar with channels and presence */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h3>Public Channels</h3>
          <span className={`connection-dot ${connected ? "online" : "offline"}`} />
        </div>
        <div className="chat-rooms">
          {ROOMS.map((room) => {
            const count = presence[room.id]?.count || 0;
            return (
              <button
                key={room.id}
                className={`room-btn ${activeRoom === room.id ? "active" : ""}`}
                onClick={() => setActiveRoom(room.id)}
              >
                <span>{room.icon}</span>
                <span style={{ flex: 1, textAlign: "left" }}>{room.label}</span>
                {count > 0 && <span className="presence-tag">{count} online</span>}
              </button>
            );
          })}
        </div>

        <div className="chat-info">
          {!token && <p>Sign in to post messages with your verified role badge</p>}
          {user && (
            <p>
              Joined as <strong>{user.name}</strong> <span className={`chat-role-badge role-${role}`}>{role}</span>
            </p>
          )}
        </div>
      </div>

      {/* Main chat window */}
      <div className="chat-main">
        <div className="chat-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Hash size={18} />
            <h4>#{activeRoom}</h4>
          </div>
          <div className="header-meta-tags">
            <span className="live-presence-indicator">
              <Users size={14} /> {currentPresence} Active Now
            </span>
            <span className={`badge ${connected ? "badge-green" : "badge-gray"}`}>
              {connected ? "RAM Cached • Live" : "Offline"}
            </span>
          </div>
        </div>

        <div className="chat-messages">
          {roomMessages.length === 0 ? (
            <div className="chat-empty">
              <span style={{ fontSize: "3rem" }}>{ROOMS.find((r) => r.id === activeRoom)?.icon}</span>
              <p>No messages yet in #{activeRoom}. Say hello to your fellow students and alumni!</p>
            </div>
          ) : (
            roomMessages.map((msg) => (
              <div key={msg.id} className={`message ${msg.user === user?.name ? "own" : ""}`}>
                <div className="msg-avatar">{(msg.user || "A").charAt(0).toUpperCase()}</div>
                <div className="msg-content">
                  <div className="msg-header">
                    <span className="msg-user">{msg.user}</span>
                    {msg.role && (
                      <span className={`chat-role-badge role-${msg.role}`}>
                        {msg.role === "master_admin"
                          ? "Master Admin"
                          : msg.role === "admin"
                          ? "Admin"
                          : msg.role === "alumni"
                          ? "Alumni"
                          : "Student"}
                      </span>
                    )}
                    <span className="msg-time">
                      {new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="msg-text">{msg.text}</div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          {!token ? (
            <div className="chat-signin-prompt">
              <p>Sign in to join the conversation</p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowLogin(true)}>
                Sign In
              </button>
            </div>
          ) : (
            <div className="chat-input-wrap">
              <input
                className="chat-input"
                placeholder={`Message #${activeRoom} as ${user?.name}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                maxLength={500}
              />
              <button className="btn btn-primary send-btn" onClick={sendMessage} disabled={!input.trim()}>
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatroom;
