import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getStudents, linkStudent, reset } from "../features/student/studentSlice.js";
import Loadingdots from "./Loadingdots.jsx";
import { toast } from "react-hot-toast";

const VISUAL_PINS = ["🌟", "🔥", "💧", "🍀"];
const PIN_COLORS = [
  "bg-indigo-400/80 backdrop-blur-md",
  "bg-indigo-500/80 backdrop-blur-md",
  "bg-indigo-600/80 backdrop-blur-md",
  "bg-indigo-700/80 backdrop-blur-md",
];

const ParentDashboardHome = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { myStudents = [], isLoading, isLinking, isError, message } = useSelector(
    (state) => state.students
  );

  const [children, setChildren] = useState([]);
  const [enrollmentId, setEnrollmentId] = useState("");
  const [visualPin, setVisualPin] = useState(["", "", "", ""]);

  // Error handling
  useEffect(() => {
    if (isError && message) {
      toast.error(message);
      dispatch(reset());
    }
  }, [isError, message, dispatch]);

  // Fetch students initially
  useEffect(() => {
    if (user?.token) {
      dispatch(getStudents(user.token));
    }
  }, [dispatch, user?.token]);

  // Update linked children whenever myStudents or user.studentIds changes
  useEffect(() => {
    if (user?.studentIds && myStudents.length > 0) {
      const linkedChildren = myStudents.filter((s) =>
        user.studentIds.includes(s._id)
      );
      setChildren(linkedChildren);
    } else {
      setChildren([]);
    }
  }, [user, myStudents]);

  // Handle visual PIN taps
  const handlePinTap = (index) => {
    setVisualPin((prev) => {
      const current = prev[index];
      const nextIndex = current
        ? (VISUAL_PINS.indexOf(current) + 1) % VISUAL_PINS.length
        : 0;
      const newSequence = [...prev];
      newSequence[index] = VISUAL_PINS[nextIndex];
      return newSequence;
    });
  };

  // Handle linking a child
  const handleLinkChild = async (e) => {
    e.preventDefault();

    if (!enrollmentId.trim()) {
      toast.error("Please enter an enrollment ID.");
      return;
    }

    if (visualPin.includes("")) {
      toast.error("Please complete all 4 parts of the visual PIN.");
      return;
    }

    try {
      // Link child; Redux slice will automatically push new student to myStudents
      await dispatch(linkStudent({ enrollmentId, visualPin })).unwrap();

      toast.success("Child linked successfully!");
      setEnrollmentId("");
      setVisualPin(["", "", "", ""]);
    } catch (err) {
      toast.error(err?.message || "Failed to link child");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loadingdots />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-4xl font-extrabold text-indigo-700 tracking-tight">
            👨‍👩‍👧 Parent Dashboard
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-indigo-100 shadow-lg">
            <h2 className="text-gray-600 font-medium mb-2">Total Children</h2>
            <p className="text-4xl font-bold text-indigo-700">{children.length}</p>
          </div>
        </div>

        {/* Children List */}
        <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-indigo-100 shadow-md">
          <h2 className="text-2xl font-semibold text-indigo-700 mb-4">👧 Child Activity</h2>
          {children.length > 0 ? (
            <ul className="space-y-3">
              {children.map((child) => (
                <li
                  key={child._id}
                  className="border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:bg-indigo-50/50 transition"
                >
                  <span className="font-medium text-gray-800 text-lg">{child.name}</span>
                  <span className="text-gray-500 text-sm">
                    {child.tasks?.length
                      ? `${child.tasks.length} task${child.tasks.length > 1 ? "s" : ""} assigned`
                      : "No tasks yet"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4">No children linked yet.</p>
          )}
        </div>

        {/* Link Child Section */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 text-white shadow-xl">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">Link a Child</h2>
          <form className="space-y-6" onSubmit={handleLinkChild}>
            {/* Enrollment ID */}
            <div>
              <label className="block text-sm font-medium mb-2">Enrollment ID</label>
              <input
                type="text"
                value={enrollmentId}
                onChange={(e) => setEnrollmentId(e.target.value)}
                placeholder="Enter child's enrollment ID"
                className="w-full bg-white/90 text-gray-800 border-none rounded-lg p-3 focus:ring-4 focus:ring-indigo-300 outline-none"
                required
              />
            </div>

            {/* Visual PIN */}
            <div>
              <label className="block text-sm font-medium mb-3">Visual PIN</label>
              <div className="flex gap-4 justify-center sm:justify-start">
                {visualPin.map((val, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePinTap(idx)}
                    className={`w-20 h-20 text-4xl rounded-2xl flex items-center justify-center border border-white/30 shadow-lg transform transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-white/50 ${PIN_COLORS[idx]}`}
                  >
                    {val || "❔"}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLinking}
              className={`w-full py-3 rounded-xl font-semibold transition ${
                isLinking
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-white text-indigo-700 hover:bg-indigo-50"
              }`}
            >
              {isLinking ? "Linking..." : "Link Child"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboardHome;
