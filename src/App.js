import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./login/login.js";
import Matches from "./matches/matches.js";
import Home from "./home/home.js";
import Messages from "./message/messages.js";
import ViewProfile from "./viewprofile/viewprofile.js";
import SendMessage from "./message/sendmessage.js";

function App() {
  const [userId, setUserId] = useState("");

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login setUserId={setUserId} />} />
        <Route path="/matches" element={<Matches userId={userId} />} />
        <Route path="/home" element={<Home userId={userId} />} />
        <Route path="/messages/:userId/:matchId" element={<Messages />} />
        <Route path="/viewprofile/*" element={<ViewProfile />} />
        <Route path="/sendmessage" element={<SendMessage />} />
      </Routes>
    </Router>
  );
}

export default App;
