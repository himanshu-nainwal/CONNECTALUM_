import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import config from "../../config";
import { io } from "socket.io-client";
import { Send, MessageCircle, Search, ArrowLeft, Circle } from "lucide-react";
import toast from "react-hot-toast";
import "./Messages.css";

let socket;

const Messages = ({ openWithUserId, openWithUserName }) => {
  const { token, user } = useContext(StoreContext);
  const [inbox, setInbox] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const messagesEndRef = useRef(null);
  const myId = user?.id || user?._id;

  // ── Define openConversation FIRST so useEffect below can reference it ──
  const openConversation = useCallback(async (userId, userName) => {
    setActiveConv({ id: userId, name: userName });
    setLoadingMsgs(true);
    setMessages([]);
    try {
      const r = await axios.get(`${config.API_URL}/messages/conversation/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(
        (r.data.messages || []).map((m) => ({
          id: m._id,
          senderId: m.sender?._id?.toString() || m.sender?.toString(),
          senderName: m.sender?.name || "Them",
          text: m.text,
          time: m.createdAt,
        }))
      );
    } catch {
      toast.error("Failed to load conversation");
    } finally {
      setLoadingMsgs(false);
    }
  }, [token]);

  // ── Socket setup ──
  useEffect(() => {
    if (!token || !myId) return;
    socket = io(config.SOCKET_URL, { transports: ["websocket", "polling"] });
    socket.emit("join_dm", myId);
    socket.on("receive_dm", (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    return () => { socket?.disconnect(); };
  }, [token, myId]);

  // ── Scroll to bottom on new message ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Load inbox ──
  const loadInbox = useCallback(() => {
    if (!token) return;
    axios
      .get(`${config.API_URL}/messages/inbox`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setInbox(r.data.inbox || []))
      .catch(() => {})
      .finally(() => setLoadingInbox(false));
  }, [token]);

  useEffect(() => { loadInbox(); }, [loadInbox, activeConv]);

  // ── Open convo from props (navigate from Mentors/Connections) ──
  useEffect(() => {
    if (openWithUserId && openWithUserName && token) {
      openConversation(openWithUserId, openWithUserName);
    }
  }, [openWithUserId, openWithUserName, token, openConversation]);

  // ── Send message ──
  const sendMessage = async () => {
    if (!text.trim() || !activeConv || !token) return;
    setSending(true);
    try {
      const r = await axios.post(
        `${config.API_URL}/messages/send`,
        { receiverId: activeConv.id, text: text.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Optimistically add to local state
      const saved = r.data.message;
      const newMsg = {
        id: saved?._id || Date.now(),
        senderId: myId,
        senderName: user?.name,
        text: text.trim(),
        time: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMsg]);
      // Also emit via socket so recipient gets it in real-time
      socket?.emit("send_dm", {
        id: newMsg.id,
        senderId: myId,
        senderName: user?.name,
        receiverId: activeConv.id,
        text: text.trim(),
      });
      setText("");
      loadInbox();
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Search alumni to start new convo ──
  useEffect(() => {
    if (!searchUser.trim()) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      axios
        .get(`${config.API_URL}/user/alumni?search=${encodeURIComponent(searchUser)}`)
        .then((r) => setSearchResults(r.data.slice(0, 5)))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [searchUser]);

  if (!token) return (
    <div className="messages-page">
      <div className="empty-state" style={{ paddingTop: "10rem" }}>
        <MessageCircle size={48} />
        <h3>Please login to view messages</h3>
      </div>
    </div>
  );

  return (
    <div className="messages-page">
      <div className="messages-layout">
        {/* ── Sidebar ── */}
        <aside className={`messages-sidebar ${activeConv ? "hidden-mobile" : ""}`}>
          <div className="messages-sidebar-header">
            <h2><MessageCircle size={20} /> Messages</h2>
          </div>

          <div className="new-convo-search">
            <div className="search-bar">
              <Search size={14} />
              <input
                placeholder="Search alumni to message..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
              />
            </div>
            {searchResults.length > 0 && (
              <div className="search-dropdown">
                {searchResults.map((u) => (
                  <button
                    key={u.id || u._id}
                    className="search-result-item"
                    onClick={() => {
                      openConversation(u.id || u._id, u.name);
                      setSearchUser("");
                      setSearchResults([]);
                    }}
                  >
                    <div className="sr-avatar">{u.name.charAt(0)}</div>
                    <div>
                      <div className="sr-name">{u.name}</div>
                      <div className="sr-role">{u.job_role || u.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="inbox-list">
            {loadingInbox ? (
              <div className="inbox-loading">Loading...</div>
            ) : inbox.length === 0 ? (
              <div className="inbox-empty">
                <MessageCircle size={32} />
                <p>No conversations yet.<br />Search above to start chatting!</p>
              </div>
            ) : (
              inbox.map((item) => (
                <button
                  key={item.user._id}
                  className={`inbox-item ${activeConv?.id === item.user._id ? "active" : ""}`}
                  onClick={() => openConversation(item.user._id, item.user.name)}
                >
                  <div className="inbox-avatar">{item.user.name.charAt(0)}</div>
                  <div className="inbox-info">
                    <div className="inbox-name">{item.user.name}</div>
                    <div className="inbox-preview">
                      {item.lastMessage?.text?.slice(0, 38)}{item.lastMessage?.text?.length > 38 ? "…" : ""}
                    </div>
                  </div>
                  {item.unread > 0 && <span className="unread-badge">{item.unread}</span>}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ── Conversation pane ── */}
        <main className={`messages-main ${!activeConv ? "hidden-mobile" : ""}`}>
          {!activeConv ? (
            <div className="no-convo">
              <MessageCircle size={56} />
              <h3>Select a conversation</h3>
              <p>Choose from your inbox or search for someone to start chatting</p>
            </div>
          ) : (
            <>
              <div className="conv-header">
                <button className="btn btn-ghost btn-sm back-btn" onClick={() => setActiveConv(null)}>
                  <ArrowLeft size={18} />
                </button>
                <div className="conv-avatar">{activeConv.name.charAt(0)}</div>
                <div>
                  <div className="conv-name">{activeConv.name}</div>
                  <div className="conv-status">
                    <Circle size={8} fill="#10b981" color="#10b981" /> Active
                  </div>
                </div>
              </div>

              <div className="conv-messages">
                {loadingMsgs ? (
                  <div className="msgs-loading">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="msgs-empty">
                    <p>👋 Say hello to {activeConv.name}!</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.senderId?.toString() === myId?.toString();
                    return (
                      <div key={msg.id || i} className={`msg-bubble-wrap ${isMe ? "mine" : "theirs"}`}>
                        {!isMe && (
                          <div className="msg-avatar">{(msg.senderName || "?").charAt(0)}</div>
                        )}
                        <div className="msg-bubble">
                          <div className="msg-text">{msg.text}</div>
                          <div className="msg-time">
                            {msg.time ? new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="conv-input">
                <textarea
                  placeholder={`Message ${activeConv.name}…`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button className="send-btn" onClick={sendMessage} disabled={sending || !text.trim()}>
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Messages;
