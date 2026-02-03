import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  resetStudentPin,
  toggleFaceAuth,
} from "../../features/student/studentSlice";

const ParentSettings = ({ student }) => {
  const dispatch = useDispatch();

  const [newPin, setNewPin] = useState(["🌟", "🔥", "💧", "🍀"]);

  const [faceEnabled, setFaceEnabled] = useState(!!student?.faceAuthEnabled);

  // Keep UI in sync if selected student changes
  useEffect(() => {
    if (student) {
      setFaceEnabled(!!student.faceAuthEnabled);
      // Reset PIN to default when student changes
      setNewPin(["🌟", "🔥", "💧", "🍀"]);
    }
  }, [student]);

  const handleResetPin = async () => {
    if (!student?._id) {
      alert("Student information not available");
      return;
    }

    if (!Array.isArray(newPin) || newPin.length === 0) {
      alert("Please set a valid visual PIN");
      return;
    }

    try {
      await dispatch(
        resetStudentPin({
          studentId: student._id,
          visualPin: newPin,
        })
      ).unwrap();

      alert("Visual PIN reset successfully");
    } catch (err) {
      alert(err || "Failed to reset PIN");
    }
  };

  const handleToggleFaceAuth = async () => {
    if (!student?._id) {
      alert("Student information not available");
      return;
    }

    try {
      await dispatch(
        toggleFaceAuth({
          studentId: student._id,
          enabled: !faceEnabled,
        })
      ).unwrap();

      setFaceEnabled((prev) => !prev);
    } catch (err) {
      alert(err || "Failed to update face authentication");
    }
  };

  if (!student) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md">
        <p className="text-gray-600">No student selected</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Student Settings</h2>

      {/* Reset PIN */}
      <section className="p-4 border rounded-lg space-y-3">
        <h4 className="text-lg font-medium text-gray-700">Reset Visual PIN</h4>

        {/* Visual PIN Selector */}
        <div className="flex gap-4 justify-center my-4">
          {newPin.map((pin, idx) => {
            const VISUAL_PINS = ["🌟", "🔥", "💧", "🍀"];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  const currentIndex = VISUAL_PINS.indexOf(pin);
                  const nextIndex = (currentIndex + 1) % VISUAL_PINS.length;
                  const newPinArray = [...newPin];
                  newPinArray[idx] = VISUAL_PINS[nextIndex];
                  setNewPin(newPinArray);
                }}
                className="w-16 h-16 text-3xl rounded-lg flex items-center justify-center shadow-md transition transform hover:scale-110 bg-indigo-100 hover:bg-indigo-200"
              >
                {pin || "❔"}
              </button>
            );
          })}
        </div>

        {/* Current PIN Display */}
        <p className="text-sm text-gray-500 text-center mb-3">
          New PIN: {newPin.join(" → ")}
        </p>

        <button
          onClick={handleResetPin}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md
                     hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Reset PIN
        </button>
      </section>

      {/* Face Login */}
      <section className="p-4 border rounded-lg space-y-3">
        <h4 className="text-lg font-medium text-gray-700">Face Login</h4>

        <p className="text-sm text-gray-600">
          Status:{" "}
          <span
            className={`font-semibold ${
              faceEnabled ? "text-green-600" : "text-red-600"
            }`}
          >
            {faceEnabled ? "Enabled" : "Disabled"}
          </span>
        </p>

        <button
          onClick={handleToggleFaceAuth}
          className={`px-4 py-2 rounded-md text-white transition
            ${
              faceEnabled
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-400"
                : "bg-green-600 hover:bg-green-700 focus:ring-green-400"
            }
            focus:outline-none focus:ring-2`}
        >
          {faceEnabled ? "Disable" : "Enable"} Face Login
        </button>
      </section>
    </div>
  );
};

export default ParentSettings;
