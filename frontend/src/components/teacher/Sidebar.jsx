
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
  FiGrid,
} from "react-icons/fi";

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const role = user?.role || "guest";
  const isTeacher = role === "teacher" || role === "admin";
  const isParent = role === "parent";

  const dashboardPath = isParent
    ? "/dashboard/parent"
    : "/dashboard/teacher";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const navigationItems = [
    {
      label: "Overview",
      path: dashboardPath,
      icon: FiHome,
      end: true,
    },
    {
      label: "Tasks",
      path: "/dashboard/tasks",
      icon: FiBookOpen,
    },
    ...(isTeacher
      ? [
          {
            label: "All Students",
            path: "/dashboard/all-students",
            icon: FiUsers,
          },
          {
            label: "Student Management",
            path: "/dashboard/students",
            icon: FiUserCheck,
          },
        ]
      : []),
    {
      label: "Settings",
      path: "/dashboard/settings",
      icon: FiSettings,
    },
  ];

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-[#1F4B47] text-white">

      {/* BRAND */}
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-7">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl font-bold text-[#2F6B66] shadow-sm">
          D
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            DownX
          </h1>
          <p className="text-xs text-white/60">
            Learn. Grow. Shine.
          </p>
        </div>
      </div>

      {/* USER WELCOME */}
      <div className="px-5 py-7">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
          Welcome back
        </p>

        <h2 className="text-lg font-bold">
          {user?.name || "User"}
        </h2>

        <span className="mt-2 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium capitalize text-[#C9E6DE]">
          {role}
        </span>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-4">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">
          Workspace
        </p>

        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-white text-[#1F4B47] shadow-md"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={19}
                      className={
                        isActive
                          ? "text-[#2F6B66]"
                          : "text-white/65 group-hover:text-white"
                      }
                    />

                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* BOTTOM PROFILE AND LOGOUT */}
      <div className="border-t border-white/10 p-5">

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DCEDE7] font-bold text-[#1F4B47]">
            {initials}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold">
              {user?.name || "DownX User"}
            </p>
            <p className="text-xs capitalize text-white/55">
              {isTeacher
                ? "Educator"
                : isParent
                  ? "Parent account"
                  : role}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition-all hover:border-red-300/30 hover:bg-red-400/15 hover:text-white"
        >
          <FiLogOut size={18} />
          Sign out
        </button>

      </div>
    </aside>
  );
};

export default Sidebar;
