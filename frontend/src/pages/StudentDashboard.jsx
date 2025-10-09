import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import { getAllTasks } from "../features/task/taskSlice";

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const user = useSelector((state) => state.auth.user);
  const { tasks, loading, error } = useSelector((state) => state.task);

  // Fetch tasks when component mounts
  useEffect(() => {
    if (user?.token) {
      dispatch(getAllTasks(user.token));
    }
  }, [dispatch, user]);

  const handleLogout = () => {
    navigate("/");
    dispatch(logout());
  };

  // Loading state (for user data)
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-6">
      {/* Logout Button */}
      <div className="w-full flex justify-end mb-6">
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Header */}
      <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>
      <p className="text-gray-700">
        Welcome, {user?.name}! Here you'll find your assigned tasks and
        progress.
      </p>

      {/* Tasks Section */}
      <div className="mt-8 w-full max-w-2xl bg-white shadow p-6 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">My Tasks</h2>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading tasks...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-4">
            <p className="text-red-500 font-semibold mb-4">
              Failed to load tasks: {error}
            </p>
            <button
              onClick={() => dispatch(getAllTasks(user.token))}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Retry
            </button>
          </div>
        )}

        {/* No Tasks */}
        {!loading && !error && tasks.length === 0 && (
          <p className="text-gray-500">No tasks assigned yet.</p>
        )}

        {/* Tasks List */}
        {!loading && !error && tasks.length > 0 && (
          <ul className="space-y-4">
            {tasks.map((task) => (
              <li
                key={task.id || task._id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
              >
                <h3 className="font-semibold text-lg text-gray-800">
                  {task.title || "Untitled Task"}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {task.description || "No description provided."}
                </p>

                {/* Simplified Steps (if available) */}
                {Array.isArray(task.simplifiedSteps) &&
                  task.simplifiedSteps.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Simplified Steps:
                      </h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 mt-1 space-y-1">
                        {task.simplifiedSteps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;