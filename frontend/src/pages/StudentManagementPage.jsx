import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  createStudent,
  linkStudent,
  reset,
} from "../features/student/studentSlice";
import Loadingdots from "../components/Loadingdots";
import { toast } from "react-hot-toast";
import { VISUAL_PIN_VALUES, VISUAL_PIN_DISPLAY } from "../utils/visualPinDisplay";

// Helper to generate a random visual PIN
const generateVisualPin = (length = 4) => {
  const pin = [];
  for (let i = 0; i < length; i++) {
    const randIndex = Math.floor(Math.random() * VISUAL_PIN_VALUES.length);
    pin.push(VISUAL_PIN_VALUES[randIndex]);
  }
  return pin;
};

const StudentManagementPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isLoading, isSuccess, isError, message } = useSelector(
    (state) => state.students
  );

  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [visualPin, setVisualPin] = useState([]);
  const [actionTriggered, setActionTriggered] = useState(false); // track if a form was submitted
  const [currentAction, setCurrentAction] = useState(""); // "create" or "link"

  // Auto-generate PIN on mount
  useEffect(() => {
    setVisualPin(generateVisualPin());
  }, []);

  // Handle success/error toast messages only after an action
  useEffect(() => {
    if (!actionTriggered) return;

    if (isSuccess) {
      if (currentAction === "create") {
        toast.success("Student added successfully!");
      } else if (currentAction === "link") {
        toast.success("Student linked successfully!");
      }
      dispatch(reset());
      setActionTriggered(false);
      setCurrentAction("");
    }

    if (isError) {
      toast.error(message || "Something went wrong");
      dispatch(reset());
      setActionTriggered(false);
      setCurrentAction("");
    }
  }, [dispatch, isSuccess, isError, message, actionTriggered, currentAction]);

  // Handle teacher: create student
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (visualPin.includes("")) return toast.error("PIN is incomplete!");

    setActionTriggered(true);
    setCurrentAction("create");

    try {
      await dispatch(createStudent({ name: studentName, visualPin })).unwrap();
      setStudentName("");
      setVisualPin(generateVisualPin()); // reset PIN after creation
    } catch (err) {
      toast.error(err.message || "Failed to create student");
      setActionTriggered(false);
      setCurrentAction("");
    }
  };

  // Handle parent: link student
  const handleLinkStudent = async (e) => {
    e.preventDefault();
    if (visualPin.includes("")) return toast.error("PIN is incomplete!");

    setActionTriggered(true);
    setCurrentAction("link");

    try {
      await dispatch(linkStudent({ enrollmentId: studentId, visualPin })).unwrap();
      setStudentId("");
      setVisualPin(generateVisualPin()); // reset PIN after linking
    } catch (err) {
      toast.error(err.message || "Failed to link student");
      setActionTriggered(false);
      setCurrentAction("");
    }
  };

  // Render PIN buttons
  const renderPinButtons = () =>
    visualPin.map((val, idx) => {
      const display = val ? VISUAL_PIN_DISPLAY[val] : null;
      const Icon = display?.Icon;
      return (
        <button
          key={idx}
          type="button"
          onClick={() =>
            setVisualPin((prev) => {
              const nextIndex =
                (VISUAL_PIN_VALUES.indexOf(prev[idx]) + 1) % VISUAL_PIN_VALUES.length;
              const newPin = [...prev];
              newPin[idx] = VISUAL_PIN_VALUES[nextIndex];
              return newPin;
            })
          }
          aria-label={display ? `Slot ${idx + 1}: ${display.label}` : `Slot ${idx + 1}: empty`}
          className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm transition-transform hover:scale-105 ring-2 ${
            display ? `${display.bg} ${display.ring}` : "bg-bg ring-border"
          }`}
        >
          {Icon ? (
            <Icon size={24} className={display.icon} />
          ) : (
            <span className="text-ink-soft text-sm font-bold">?</span>
          )}
        </button>
      );
    });

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
        Student Management
      </h1>

      {/* Teacher: create student */}
      {user?.role === "teacher" && (
        <div className="mb-10 bg-white shadow-lg rounded-3xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Add New Student</h2>
          <form onSubmit={handleCreateStudent} className="flex flex-col gap-3 items-center">
            <input
              type="text"
              placeholder="Student's Name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="border p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <div className="flex gap-4 mt-4 items-center">
              {renderPinButtons()}
              <button
                type="button"
                onClick={() => setVisualPin(generateVisualPin())}
                className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Regenerate PIN
              </button>
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 mt-4 flex justify-center items-center disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? <Loadingdots /> : "Add Student"}
            </button>
          </form>
        </div>
      )}

      {/* Parent: link student */}
      {user?.role === "parent" && (
        <div className="bg-white shadow-lg rounded-3xl p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Link to Existing Student</h2>
          <form onSubmit={handleLinkStudent} className="flex flex-col gap-3 items-center">
            <input
              type="text"
              placeholder="Student ID / Enrollment Code"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="border p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />

            <div className="flex gap-4 mt-4 items-center">
              {renderPinButtons()}
              <button
                type="button"
                onClick={() => setVisualPin(generateVisualPin())}
                className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Regenerate PIN
              </button>
            </div>

            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 mt-4 flex justify-center items-center disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? <Loadingdots /> : "Link Student"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default StudentManagementPage;