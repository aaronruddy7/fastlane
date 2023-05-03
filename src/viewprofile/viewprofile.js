import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../server/axios.js";

const ViewProfile = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const matchId = searchParams.get("user_id");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`/user/${matchId}`);
        setUser(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchUser();
  }, [matchId]);

  const calculateAge = (dob) => {
    const birthdate = new Date(dob);
    const now = new Date();
    const diff = now.getTime() - birthdate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <div>
      {user ? (
        <div>
          <h1>
            {user.first_name} {calculateAge(user.dob)}
          </h1>
          <p>{user.bio}</p>
          <button onClick={() => navigate(-1)}>Back</button>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default ViewProfile;
