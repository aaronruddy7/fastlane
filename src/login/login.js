import React, { useState } from "react";
import axios from "../server/axios.js";
import { useNavigate } from "react-router-dom";
import "./login.css";

const Login = ({ setUserId }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    console.log(email, password); // add this line
    try {
      const res = await axios.post("/login", { email, password });
      if (res.data.userId) {
        // check if user ID is returned from server
        const userId = res.data.userId; // get user ID from response
        setUserId(userId); // set the user ID in the App component
        navigate("/matches"); // redirect to Matches component
      } else {
        setError(res.data.error);
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit">Submit</button>
      </form>
      {error && <div>{error}</div>}
    </div>
  );
};

export default Login;
