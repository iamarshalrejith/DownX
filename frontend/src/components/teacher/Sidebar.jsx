import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, NavLink } from "react-router-dom";
import { logout } from "../../features/auth/authSlice.js";
import {
  FiHome,
  FiUsers,
  FiBookOpen,
  FiUserCheck,
  FiLogOut,
  FiSettings,
} from "react-icons/fi";

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const role = user?.role || "guest";

  return (
   <div className="min-h-screen w-64 bg-indigo-600 text-white flex flex-col shadow-lg">
      {/* Top Section */}
      <div>
        {/* User Info */}
        <div className="p-6 border-b border-indigo-500">
          <h2 className="text-lg font-semibold">Welcome,</h2>
          <p className="text-sm opacity-90">
            {user?.name || "User"} ({role})
          </p>
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex flex-col font-semibold space-y-1">
          {/* Dashboard */}
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 hover:bg-indigo-700 transition ${
                isActive ? "bg-indigo-900" : ""
              }`
            }
          >
            <FiHome size={18} /> Dashboard
          </NavLink>

          {/* Tasks — visible to everyone */}
          <NavLink
            to="/dashboard/tasks"
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 hover:bg-indigo-700 transition ${
                isActive ? "bg-indigo-900" : ""
              }`
            }
          >
            <FiBookOpen size={18} /> Tasks
          </NavLink>

          {/* Teacher/Admin Only Links */}
          {(role === "teacher" || role === "admin") && (
            <>
              <NavLink
                to="/dashboard/all-students"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-3 hover:bg-indigo-700 transition ${
                    isActive ? "bg-indigo-900" : ""
                  }`
                }
              >
                <FiUsers size={18} /> All Students
              </NavLink>

              <NavLink
                to="/dashboard/students"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-3 hover:bg-indigo-700 transition ${
                    isActive ? "bg-indigo-900" : ""
                  }`
                }
              >
                <FiUserCheck size={18} /> Student Management
              </NavLink>

              <NavLink
                to="/dashboard/settings"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-3 hover:bg-indigo-700 transition ${
                    isActive ? "bg-indigo-900" : ""
                  }`
                }
              >
                <FiSettings size={18} /> Settings
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-6 border-t border-indigo-500">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full bg-white text-indigo-700 hover:bg-indigo-100 py-2 px-4 rounded-3xl font-semibold transition "
        >
          <FiLogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
