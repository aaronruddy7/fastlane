import React, { useState, useEffect } from "react";
import axios from "../server/axios";

function Matches({ userId }) {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    // Make GET request to Flask endpoint to retrieve matches
    axios
      .get(`/matches/${userId}`)
      .then((response) => {
        setMatches(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [userId]);

  return (
    <div>
      <h2>Your Matches:</h2>
      <ul>
        {matches.map((match, index) => (
          <li key={index}>{match}</li>
        ))}
      </ul>
    </div>
  );
}

export default Matches;
