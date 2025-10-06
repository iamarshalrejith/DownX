import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../features/auth/authSlice";

const StudentDashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    navigate("/");
    dispatch(logout());
  };

  // Simple loading state while user data loads
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
      
      <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>
      <p className="text-gray-700">
        Welcome, {user?.name}! Here you'll find your assigned tasks and
        progress.
      </p>

      {/* Tasks placeholder */}
      <div className="mt-8 w-full max-w-2xl bg-white shadow p-6 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">My Tasks</h2>
        <p className="text-gray-500">No tasks assigned yet.</p>
      </div>
    </div>
  );
};

export default StudentDashboard;