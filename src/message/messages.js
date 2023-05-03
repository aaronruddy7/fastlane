import axios from "../server/axios.js";
import SendMessage from "./sendmessage.js";
import "./messages.css";
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";

const Messages = () => {
  const { userId, matchId } = useParams();
  const [messages, setMessages] = useState([]);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Get user's first name
        const resUser = await axios.get(`/user/${matchId}`);
        setUserName(resUser.data.first_name);

        // Get messages
        const resMsg = await axios.get(
          `/messages?id=${userId}&user_id=${matchId}`
        );
        const sortedMsg = resMsg.data.sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        setMessages(sortedMsg);
      } catch (err) {
        console.log(err);
      }
    };

    fetchMessages();

    const interval = setInterval(async () => {
      fetchMessages();
    }, 5000); // refresh messages every 5 seconds

    return () => clearInterval(interval);
  }, [userId, matchId]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1);
    return date.toLocaleTimeString();
  };

  return (
    <div className="messages-container">
      <div className="username-card">
        <button onClick={() => navigate(-1)}>◄</button>

        <Link
          to={`/viewprofile?user_id=${matchId}`}
          className="view-profile-link"
        >
          {userName}
        </Link>
      </div>
      <div className="messages-list">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg._id} className="message-card">
              <div className="message-timestamp">
                {formatDate(msg.timestamp)}
              </div>
              <div
                className={`bubble ${
                  msg.sender_id === userId ? "sender" : "recipient"
                }`}
              >
                {msg.message}
              </div>
            </div>
          ))
        ) : (
          <p>
            You haven’t started chatting with {userName} yet, don’t be shy and
            send them a message! 😏
          </p>
        )}
      </div>
      <div className="send-message-container">
        <SendMessage matchId={matchId} senderId={userId} />
      </div>
    </div>
  );
};

export default Messages;
