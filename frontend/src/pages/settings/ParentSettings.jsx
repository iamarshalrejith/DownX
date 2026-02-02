import { useState } from "react";

const ParentSettings = ({ student, token }) => {
  const [newPin, setNewPin] = useState([]);
  const [faceEnabled, setFaceEnabled] = useState(student.faceAuthEnabled);

  const resetPin = async () => {
    await fetch(`/api/students/${student._id}/reset-pin`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ visualPin: newPin }),
    });

    alert("PIN reset successfully");
  };

  const toggleFaceAuth = async () => {
    await fetch(`/api/students/${student._id}/face-auth`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ enabled: !faceEnabled }),
    });

    setFaceEnabled(!faceEnabled);
  };

  return (
    <div>
      <h2>Student Settings</h2>

      <section>
        <h4>Reset Visual PIN</h4>
        {/* Your visual pin UI here */}
        <button onClick={resetPin}>Reset PIN</button>
      </section>

      <section>
        <h4>Face Login</h4>
        <p>Status: {faceEnabled ? "Enabled" : "Disabled"}</p>
        <button onClick={toggleFaceAuth}>
          {faceEnabled ? "Disable" : "Enable"} Face Login
        </button>
      </section>
    </div>
  );
};

export default ParentSettings;
