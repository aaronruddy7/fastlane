import React from "react";
import axios from "../axios";

function Logout() {
  const handleLogout = () => {
    const userId = sessionStorage.getItem("userId");

    axios
      .post("/logout", {
        user_id: userId,
      })
      .then((response) => {
        if (response.data.error) {
          console.log(response.data.error);
        } else {
          sessionStorage.removeItem("userId");
          // do any other necessary handling after successful logout
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <div>
      <button onClick={handleLogout}>Log Out</button>
    </div>
  );
}

export default Logout;
