import React from 'react';
import Chatroom from '../../components/Chatroom/Chatroom';
import './Chat.css';

const Chat = () => (
  <div className="chat-page">
    <div className="container">
      <div className="chat-page-header">
        <h1>Community</h1>
        <p>Connect, discuss, and grow together with students and alumni.</p>
      </div>
      <Chatroom />
    </div>
  </div>
);

export default Chat;
