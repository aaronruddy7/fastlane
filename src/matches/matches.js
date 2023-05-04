import React, { useState, useEffect } from "react";
import axios from "../server/axios.js";
import Messages from "../message/messages.js";
import { Link, useNavigate } from "react-router-dom";
import "./matches.css";

const Matches = ({ userId }) => {
  // get user ID from App component
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setError("");
      try {
        const res = await axios.get(`/matches/${userId}`); // get matches from Flask route
        const matchesData = res.data; // array of match IDs

        // call Flask route for each match to get user info and latest message
        const matchesWithInfo = await Promise.all(
          // wait for all promises to resolve before setting state to avoid error
          matchesData.map(async (matchId) => {
            // map over matches array and return array of promises
            const [userRes, messageRes] = await Promise.all([
              axios.get(`/user/${matchId}`), // get user info from Flask route
              axios.get(`/messageslatest?id=${userId}&user_id=${matchId}`), // get latest message from Flask route
            ]);
            return {
              id: userRes.data._id,
              name: userRes.data.first_name,
              message: messageRes.data.message,
              latestMessageId: messageRes.data.sender_id,
              timestamp: messageRes.data.timestamp,
            };
          })
        );

        // sort matches by timestamp of latest message (most recent first) and set state
        matchesWithInfo.sort((a, b) => b.timestamp - a.timestamp);

        setMatches(matchesWithInfo); // set state to array of objects with match IDs, names, and latest messages
      } catch (err) {
        setError(err.response.data.error);
      }
    };

    if (userId) {
      fetchData();
    } else {
      navigate("/login"); // redirect to Login component if user ID is not available
    }
  }, [userId, navigate]);

  return (
    <div className="matches-container">
      {error ? (
        <div>{error}</div>
      ) : (
        <ul className="matches-list">
          {matches.map((match) => (
            <li key={match.id} className="matches-list-item">
              <Link
                to={`/messages/${userId}/${match.id}`}
                className="match-link"
              >
                <div className="match-card">
                  <div
                    style={{
                      fontSize: "22pt",
                      display: "inline-block",
                      marginRight: "10px",
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      backgroundColor: "#ddd",
                      textAlign: "center",
                      lineHeight: "50px",
                      textTransform: "uppercase",
                    }}
                    className="match-circle"
                  >
                    {match.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="match-name">
                    {match.name.charAt(0).toUpperCase() + match.name.slice(1)}
                  </div>

                  {match.message ? (
                    match.latestMessageId === userId ? (
                      <div className="match-message">
                        ↩{" "}
                        {match.message.slice(0, 30) +
                          (match.message.length > 30 ? "..." : "")}
                      </div>
                    ) : (
                      <div className="match-message-reply">
                        {match.message.slice(0, 30) +
                          (match.message.length > 30 ? "..." : "")}{" "}
                        Your turn
                      </div>
                    )
                  ) : (
                    <div className="match-message">
                      Send {match.name} a message
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Matches;
