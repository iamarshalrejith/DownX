import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getStudents,
  linkStudent,
  reset,
} from "../features/student/studentSlice.js";
import { getAllTasks } from "../features/task/taskSlice.js";
import StudentTaskView from "../modals/StudentTaskView.jsx";
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

  const {
    tasks = [],
    loading: taskLoading,
    error: taskError,
  } = useSelector((state) => state.task || {});

  const {
    myStudents = [],
    isLoading,
    isLinking,
    isError,
    message,
  } = useSelector((state) => state.students);

  const [children, setChildren] = useState([]);
  const [enrollmentId, setEnrollmentId] = useState("");
  const [visualPin, setVisualPin] = useState(["", "", "", ""]);

  // Modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Error handling
  useEffect(() => {
    if (isError && message) {
      toast.error(message);
      dispatch(reset());
    }
    if (taskError) toast.error(taskError);
  }, [isError, message, dispatch, taskError]);

  // Fetch students initially
  useEffect(() => {
    if (user?.token) {
      dispatch(getStudents(user.token));
      dispatch(getAllTasks(user.token));
    }
  }, [dispatch, user?.token]);

  // Get task info for a specific child
  const getChildTaskInfo = (childId) => {
    const childTasks = tasks.filter(
      (t) => t.assignedToAll || t.assignedTo?._id === childId
    );

    const completedTasks = childTasks.filter((task) => {
      if (task.assignedToAll) {
        // Check if this child completed it
        return task.completedBy?.some((c) => c.studentId._id === childId);
      }
      return task.isCompleted;
    });

    return {
      tasks: childTasks,
      total: childTasks.length,
      completed: completedTasks.length,
      pending: childTasks.length - completedTasks.length,
    };
  };

  // Update linked children whenever myStudents or user.studentIds changes
  useEffect(() => {
    if (user?.studentIds && myStudents.length > 0) {
      const linkedChildren = myStudents.filter((s) =>
        user.studentIds.includes(s._id)
      );

      // Attach filtered tasks with completion info for each child
      const withTasks = linkedChildren.map((child) => {
        const taskInfo = getChildTaskInfo(child._id);
        return {
          ...child,
          ...taskInfo,
        };
      });
      setChildren(withTasks);
    } else {
      setChildren([]);
    }
  }, [user, myStudents, tasks]);

  // Calculate overall statistics
  const getOverallStats = () => {
    const totalTasks = children.reduce((sum, c) => sum + c.total, 0);
    const totalCompleted = children.reduce((sum, c) => sum + c.completed, 0);
    const totalPending = children.reduce((sum, c) => sum + c.pending, 0);

    return { totalTasks, totalCompleted, totalPending };
  };

  const stats = getOverallStats();

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
      await dispatch(linkStudent({ enrollmentId, visualPin })).unwrap();
      toast.success("Child linked successfully!");
      setEnrollmentId("");
      setVisualPin(["", "", "", ""]);
    } catch (err) {
      toast.error(err?.message || "Failed to link child");
    }
  };

  // Modal handlers
  const handleChildClick = (child) => {
    setSelectedStudent(child);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedStudent(null), 300);
  };

  if (isLoading || taskLoading) {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-indigo-100 shadow-lg hover:shadow-xl transition">
            <h2 className="text-gray-600 font-medium mb-2">Total Children</h2>
            <p className="text-4xl font-bold text-indigo-700">
              {children.length}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-indigo-100 shadow-lg hover:shadow-xl transition">
            <h2 className="text-gray-600 font-medium mb-2">Total Tasks</h2>
            <p className="text-4xl font-bold text-indigo-700">
              {stats.totalTasks}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-green-100 shadow-lg hover:shadow-xl transition">
            <h2 className="text-gray-600 font-medium mb-2">Completed</h2>
            <p className="text-4xl font-bold text-green-600">
              {stats.totalCompleted}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-orange-100 shadow-lg hover:shadow-xl transition">
            <h2 className="text-gray-600 font-medium mb-2">Pending</h2>
            <p className="text-4xl font-bold text-orange-600">
              {stats.totalPending}
            </p>
          </div>
        </div>

        {/* Children List with Task Progress */}
        <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-indigo-100 shadow-md">
          <h2 className="text-2xl font-semibold text-indigo-700 mb-4">
            👧 Child Activity
          </h2>
          {children.length > 0 ? (
            <ul className="space-y-4">
              {children.map((child) => {
                const completionRate =
                  child.total > 0
                    ? Math.round((child.completed / child.total) * 100)
                    : 0;

                return (
                  <li
                    key={child._id}
                    onClick={() => handleChildClick(child)} // Modal trigger
                    className="border border-gray-200 rounded-xl p-5 hover:bg-indigo-50/50 transition cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      {/* Child Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg mb-2">
                          {child.name}
                        </h3>

                        {child.total > 0 ? (
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600">
                              {child.total} task
                              {child.total !== 1 ? "s" : ""}
                            </span>
                            <span className="text-green-600 font-medium">
                              ✓ {child.completed} completed
                            </span>
                            {child.pending > 0 && (
                              <span className="text-orange-600">
                                ⏳ {child.pending} pending
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">
                            No tasks assigned yet
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {child.total > 0 && (
                        <div className="flex flex-col items-end sm:ml-4">
                          <span className="text-sm font-semibold text-indigo-700 mb-2">
                            {completionRate}% Complete
                          </span>
                          <div className="w-full sm:w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No children linked yet.
            </p>
          )}
        </div>

        {/* Link Child Section */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 text-white shadow-xl">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            Link a Child
          </h2>
          <form className="space-y-6" onSubmit={handleLinkChild}>
            {/* Enrollment ID */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Enrollment ID
              </label>
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
              <label className="block text-sm font-medium mb-3">
                Visual PIN
              </label>
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

      {/* Student Task Modal */}
      <StudentTaskView
        isOpen={isModalOpen}
        onClose={closeModal}
        student={selectedStudent}
        tasks={tasks}
      />
    </div>
  );
};

export default ParentDashboardHome;
