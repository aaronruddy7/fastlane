import axios from "../server/axios";
import "./sendmessages.css";
import React, { useState } from "react";

const SendMessage = (props) => {
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim() === "") {
      // Check for empty message
      return;
    }
    try {
      const timestamp = new Date().getTime();
      const date = new Date(timestamp);
      console.log(date.toString()); // output: "Sat Apr 30 2023 15:14:25 GMT-0700 (Pacific Daylight Time)"

      const matchIdParam = encodeURIComponent(props.matchId);
      const senderIdParam = encodeURIComponent(props.senderId);
      const messageParam = encodeURIComponent(message);
      const timestampParam = encodeURIComponent(timestamp);
      const requestUrl = `/message?id=${senderIdParam}&user_id=${matchIdParam}&message=${messageParam}&timestamp=${timestampParam}`;
      const res = await axios.post(requestUrl);
      console.log(res.data);
      setMessage("");

      // Fetch latest messages
      const resMsg = await axios.get(
        `/messages?match_id=${matchIdParam}&sender_id=${senderIdParam}`
      );
      const sortedMsg = resMsg.data.sort(
        // sort messages by timestamp
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp) //
      );
      props.updateMessages(sortedMsg); // pass the latest messages to the parent component
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="send-message-container">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="send a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="send-message-input"
        />
        <button type="submit" className="send-message-button">
          ➤
        </button>
      </form>
    </div>
  );
};

export default SendMessage;
