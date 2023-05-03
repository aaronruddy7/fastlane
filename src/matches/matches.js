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
    document.title = "Matches";
    const fetchData = async () => {
      setError("");
      try {
        const res = await axios.get(`/matches/${userId}`);
        setMatches(res.data);
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
    <div>
      <h2>Matches</h2>
      {error ? (
        <div>{error}</div>
      ) : (
        <ul>
          {matches.map((matchId) => (
            <li key={matchId} className="match-card">
              <div>{matchId}</div>
              <button className="message-button">
                <Link to={`/messages/${userId}/${matchId}`}>Message</Link>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Matches;
