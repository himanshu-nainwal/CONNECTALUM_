import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import config from "../../config";
import { io } from "socket.io-client";
import { Send, MessageCircle, Search, ArrowLeft, Circle, Paperclip, FileText, CheckCircle2 } from "lucide-react";
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
  const [isTyping, setIsTyping] = useState(false);
  const [showAttachInput, setShowAttachInput] = useState(false);
  const [attachUrl, setAttachUrl] = useState("");
  const [attachName, setAttachName] = useState("");
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const myId = user?.id || user?._id;

  const openConversation = useCallback(
    async (userId, userName) => {
      setActiveConv({ id: userId, name: userName });
      setLoadingMsgs(true);
      setMessages([]);
      setIsTyping(false);
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
            attachment_url: m.attachment_url,
            attachment_name: m.attachment_name,
            time: m.createdAt,
          }))
        );
      } catch {
        toast.error("Failed to load conversation");
      } finally {
        setLoadingMsgs(false);
      }
    },
    [token]
  );

  // Socket setup
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

    socket.on("user_typing", (data) => {
      if (activeConv && data.senderId === activeConv.id) {
        setIsTyping(true);
      }
    });

    socket.on("user_stop_typing", (data) => {
      if (activeConv && data.senderId === activeConv.id) {
        setIsTyping(false);
      }
    });

    return () => {
      socket?.disconnect();
    };
  }, [token, myId, activeConv]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Load inbox
  const loadInbox = useCallback(() => {
    if (!token) return;
    axios
      .get(`${config.API_URL}/messages/inbox`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setInbox(r.data.inbox || []))
      .catch(() => {})
      .finally(() => setLoadingInbox(false));
  }, [token]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox, activeConv]);

  useEffect(() => {
    if (openWithUserId && openWithUserName && token) {
      openConversation(openWithUserId, openWithUserName);
    }
  }, [openWithUserId, openWithUserName, token, openConversation]);

  // Handle typing indicator emission
  const handleInputChange = (e) => {
    setText(e.target.value);
    if (socket && activeConv) {
      socket.emit("typing", { senderId: myId, senderName: user?.name, receiverId: activeConv.id });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { senderId: myId, receiverId: activeConv.id });
      }, 1500);
    }
  };

  // Send message
  const sendMessage = async () => {
    if ((!text.trim() && !attachUrl.trim()) || !activeConv || !token) return;
    setSending(true);

    try {
      const r = await axios.post(
        `${config.API_URL}/messages/send`,
        {
          receiverId: activeConv.id,
          text: text.trim(),
          attachmentUrl: attachUrl.trim(),
          attachmentName: attachName.trim() || (attachUrl ? "Attached Document" : ""),
          attachmentType: "application/pdf",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const saved = r.data.message;
      const newMsg = {
        id: saved?._id || Date.now(),
        senderId: myId,
        senderName: user?.name,
        text: text.trim() || (attachName ? `Shared document: ${attachName}` : "Attachment"),
        attachment_url: attachUrl.trim(),
        attachment_name: attachName.trim(),
        time: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newMsg]);

      socket?.emit("send_dm", {
        id: newMsg.id,
        senderId: myId,
        senderName: user?.name,
        receiverId: activeConv.id,
        text: newMsg.text,
        attachment_url: newMsg.attachment_url,
        attachment_name: newMsg.attachment_name,
      });

      socket?.emit("stop_typing", { senderId: myId, receiverId: activeConv.id });
      setText("");
      setAttachUrl("");
      setAttachName("");
      setShowAttachInput(false);
      loadInbox();
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Search alumni
  useEffect(() => {
    if (!searchUser.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      axios
        .get(`${config.API_URL}/user/alumni?search=${encodeURIComponent(searchUser)}`)
        .then((r) => setSearchResults(r.data.slice(0, 5)))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [searchUser]);

  if (!token)
    return (
      <div className="messages-page">
        <div className="empty-state" style={{ paddingTop: "10rem" }}>
          <MessageCircle size={48} />
          <h3>Please login to view direct messages</h3>
        </div>
      </div>
    );

  return (
    <div className="messages-page">
      <div className="messages-layout">
        {/* Sidebar */}
        <aside className={`messages-sidebar ${activeConv ? "hidden-mobile" : ""}`}>
          <div className="messages-sidebar-header">
            <h2>
              <MessageCircle size={20} /> Messages
            </h2>
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
              <div className="inbox-loading">Loading conversations...</div>
            ) : inbox.length === 0 ? (
              <div className="inbox-empty">
                <MessageCircle size={32} />
                <p>
                  No direct conversations yet.
                  <br />
                  Search above to start chatting with verified alumni!
                </p>
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
                      {item.lastMessage?.text?.slice(0, 38)}
                      {item.lastMessage?.text?.length > 38 ? "…" : ""}
                    </div>
                  </div>
                  {item.unread > 0 && <span className="unread-badge">{item.unread}</span>}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Conversation pane */}
        <main className={`messages-main ${!activeConv ? "hidden-mobile" : ""}`}>
          {!activeConv ? (
            <div className="no-convo">
              <MessageCircle size={56} />
              <h3>Select a conversation</h3>
              <p>Choose from your inbox or search for alumni to start direct messaging</p>
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
                    <Circle size={8} fill="#10b981" color="#10b981" /> Verified Alum / Active
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
                        {!isMe && <div className="msg-avatar">{(msg.senderName || "?").charAt(0)}</div>}
                        <div className="msg-bubble">
                          <div className="msg-text">{msg.text}</div>
                          {msg.attachment_url && (
                            <div className="msg-attachment-pill">
                              <FileText size={15} />
                              <a href={msg.attachment_url} target="_blank" rel="noreferrer">
                                {msg.attachment_name || "View Attached PDF Resume"}
                              </a>
                            </div>
                          )}
                          <div className="msg-time">
                            {msg.time
                              ? new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                              : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {isTyping && (
                  <div className="typing-indicator-row">
                    <span>{activeConv.name} is typing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Attachment Popover */}
              {showAttachInput && (
                <div className="attach-popover">
                  <div className="attach-popover-header">
                    <span>Attach PDF Resume / Portfolio Link</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowAttachInput(false)}>
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Document Title (e.g. SDE-Resume-2026.pdf)"
                    value={attachName}
                    onChange={(e) => setAttachName(e.target.value)}
                  />
                  <input
                    type="url"
                    placeholder="Link URL (e.g. Google Drive / DropBox PDF link)"
                    value={attachUrl}
                    onChange={(e) => setAttachUrl(e.target.value)}
                  />
                </div>
              )}

              <div className="conv-input">
                <button
                  type="button"
                  className={`attach-btn ${showAttachInput ? "active" : ""}`}
                  onClick={() => setShowAttachInput(!showAttachInput)}
                  title="Share PDF Resume or Document"
                >
                  <Paperclip size={18} />
                </button>
                <textarea
                  placeholder={`Message ${activeConv.name}…`}
                  value={text}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button className="send-btn" onClick={sendMessage} disabled={sending || (!text.trim() && !attachUrl.trim())}>
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
