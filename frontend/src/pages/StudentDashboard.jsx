import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../features/auth/authSlice";

const StudentDashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const dispatch = useDispatch()

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (user.role === "student") {
      setAuthorized(true);
    } else if (user.role === "teacher" || user.role === "parent") {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!authorized) return null;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login")
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-6">
      {/* Logout Button */}
      <div className="w-full flex justify-end mb-6">
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
        >
          Logout
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>
      <p className="text-gray-700">
        Welcome, {user?.name}! Here you’ll find your assigned tasks and
        progress.
      </p>

      {/* tasks -> placeholder (we ll fetch from backend later) */}
      <div className="mt-8 w-full max-w-2xl bg-white shadow p-6 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">My Tasks</h2>
        <p>No tasks assigned yet.</p>
      </div>
    </div>
  );
};

export default StudentDashboard;
