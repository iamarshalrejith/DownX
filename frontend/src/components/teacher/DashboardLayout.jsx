
import React from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import GestureHelp from "../gesture/GestureHelp";
import { FiBell, FiSearch } from "react-icons/fi";

const DashboardLayout = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();

  const showGestureHelp =
    user?.role === "teacher" || user?.role === "parent";

  const getPageTitle = () => {
    const path = location.pathname;

    if (path.includes("/all-students")) return "All Students";
    if (path.includes("/students")) return "Student Management";
    if (path.includes("/tasks/create")) return "Create Task";
    if (path.includes("/tasks")) return "Tasks";
    if (path.includes("/settings")) return "Settings";
    if (path.includes("/parent")) return "Parent Dashboard";

    return "Teacher Dashboard";
  };

  const getPageDescription = () => {
    const path = location.pathname;

    if (path.includes("/all-students") || path.includes("/students")) {
      return "Manage your students and follow their learning journey.";
    }

    if (path.includes("/tasks")) {
      return "Create, organize and manage learning activities.";
    }

    if (path.includes("/settings")) {
      return "Manage your account and preferences.";
    }

    if (path.includes("/parent")) {
      return "Stay connected with your child's learning journey.";
    }

    return "Here's what's happening with your learning community today.";
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div className="flex min-h-screen bg-[#F6F4EF]">

      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* RIGHT CONTENT AREA */}
      <div className="min-w-0 flex-1">

        {/* TOP HEADER */}
        <header className="sticky top-0 z-30 flex min-h-[84px] items-center justify-between border-b border-[#E6E2D8] bg-white/95 px-5 backdrop-blur-md sm:px-8 lg:px-10">

          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#262521] sm:text-2xl">
              {getPageTitle()}
            </h1>

            <p className="mt-1 hidden text-sm text-[#6B6863] sm:block">
              {getPageDescription()}
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">

            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E6E2D8] bg-white text-[#6B6863] transition hover:bg-[#F0F5F2]"
            >
              <FiBell size={19} />
            </button>

            <div className="hidden h-9 w-px bg-[#E6E2D8] sm:block" />

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E4EFEE] font-bold text-[#2F6B66]">
                {initials}
              </div>

              <div className="hidden sm:block">
                <p className="max-w-[150px] truncate text-sm font-bold text-[#262521]">
                  {user?.name || "User"}
                </p>

                <p className="text-xs capitalize text-[#6B6863]">
                  {user?.role || "Member"}
                </p>
              </div>
            </div>

          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="min-h-[calc(100vh-84px)] p-5 sm:p-8 lg:p-10">
          <div className="mx-auto w-full max-w-[1600px] animate-rise">
            {children}
          </div>
        </main>

      </div>

      {/* FLOATING GESTURE HELP */}
      {showGestureHelp && <GestureHelp />}

    </div>
  );
};

export default DashboardLayout;
