import React, { useState, useEffect, useRef, useContext } from "react";
import { io } from "socket.io-client";
import { StoreContext } from "../../context/StoreContext";
import { Send, Hash, Smile } from "lucide-react";
import config from "../../config";
import "./Chatroom.css";

const ROOMS = [
  { id: "general", name: "General", icon: "💬" },
  { id: "jobs", name: "Jobs & Careers", icon: "💼" },
  { id: "tech", name: "Tech Talk", icon: "⚡" },
  { id: "events", name: "Events", icon: "📅" },
];

const Chatroom = () => {
  const { user, token, setShowLogin } = useContext(StoreContext);
  const [socket, setSocket] = useState(null);
  const [activeRoom, setActiveRoom] = useState("general");
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const sock = io(config.SOCKET_URL || "http://localhost:4000", {
      transports: ['websocket', 'polling']
    });
    sock.on('connect', () => setConnected(true));
    sock.on('disconnect', () => setConnected(false));
    sock.on('chat_history', (history) => {
      setMessages(prev => ({ ...prev, [activeRoom]: history }));
    });
    sock.on('receive_message', (msg) => {
      setMessages(prev => ({
        ...prev,
        [msg.room]: [...(prev[msg.room] || []), msg]
      }));
    });
    setSocket(sock);
    return () => sock.disconnect();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.emit('join_room', activeRoom);
      if (!messages[activeRoom]) setMessages(prev => ({ ...prev, [activeRoom]: [] }));
    }
  }, [activeRoom, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages[activeRoom]]);

  const sendMessage = () => {
    if (!token) { setShowLogin(true); return; }
    if (!input.trim() || !socket) return;
    socket.emit('send_message', {
      user: user?.name || 'Anonymous',
      text: input.trim(),
      room: activeRoom
    });
    setInput("");
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const roomMessages = messages[activeRoom] || [];

  return (
    <div className="chat-layout">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h3>Community</h3>
          <span className={`connection-dot ${connected ? 'online' : 'offline'}`} />
        </div>
        <div className="chat-rooms">
          {ROOMS.map(room => (
            <button
              key={room.id}
              className={`room-btn ${activeRoom === room.id ? 'active' : ''}`}
              onClick={() => setActiveRoom(room.id)}
            >
              <span>{room.icon}</span>
              <span>{room.name}</span>
              {messages[room.id]?.length > 0 && activeRoom !== room.id && (
                <span className="unread-badge">{messages[room.id].length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="chat-info">
          {!token && <p>Sign in to participate in discussions</p>}
          {user && <p>Chatting as <strong>{user.name}</strong></p>}
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <Hash size={18} />
          <h4>{ROOMS.find(r => r.id === activeRoom)?.name}</h4>
          <span className={`badge ${connected ? 'badge-green' : 'badge-gray'}`}>
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>

        <div className="chat-messages">
          {roomMessages.length === 0 ? (
            <div className="chat-empty">
              <span style={{ fontSize: '3rem' }}>
                {ROOMS.find(r => r.id === activeRoom)?.icon}
              </span>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : roomMessages.map((msg) => (
            <div key={msg.id} className={`message ${msg.user === user?.name ? 'own' : ''}`}>
              <div className="msg-avatar">{(msg.user || 'A').charAt(0).toUpperCase()}</div>
              <div className="msg-content">
                <div className="msg-header">
                  <span className="msg-user">{msg.user}</span>
                  <span className="msg-time">
                    {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="msg-text">{msg.text}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          {!token ? (
            <div className="chat-signin-prompt">
              <p>Sign in to join the conversation</p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowLogin(true)}>Sign In</button>
            </div>
          ) : (
            <div className="chat-input-wrap">
              <input
                className="chat-input"
                placeholder={`Message #${ROOMS.find(r => r.id === activeRoom)?.name}...`}
                value={input}
                onChange={e => setInput(e.target.value)}
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
