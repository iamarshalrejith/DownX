/**
 * RoleSelectionPage.jsx
 *
 * DS-FRIENDLY REDESIGN:
 * 1. Student card is much larger and more obvious — the main user
 * 2. Warmer, friendlier palette (sunny orange/yellow)
 * 3. Big emoji icons instead of small react-icons
 * 4. Text sizes larger throughout
 * 5. Cleaner, less cluttered layout
 */

import React from "react";
import { useNavigate } from "react-router-dom";

const RoleSelectionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 via-orange-50 to-white flex flex-col items-center justify-center px-5 py-10">

      {/* App logo / name */}
      <div className="text-center mb-10">
        <div className="text-7xl mb-3">🧠</div>
        <h1 className="text-5xl font-extrabold text-orange-700 tracking-tight">
          DownX
        </h1>
        <p className="text-xl text-gray-500 mt-2 font-medium">
          Learning made fun!
        </p>
      </div>

      {/* Who are you? */}
      <p className="text-3xl font-extrabold text-gray-700 mb-8 text-center">
        Who are you?
      </p>

      <div className="flex flex-col gap-5 w-full max-w-sm">

        {/* Student — primary, biggest */}
        <button
          onClick={() => navigate("/student-login")}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-3xl py-8 px-6 flex items-center gap-5 shadow-xl transition-all hover:scale-[1.02] active:scale-95"
        >
          <span className="text-6xl flex-shrink-0">🎒</span>
          <div className="text-left">
            <p className="text-3xl font-extrabold leading-tight">Student</p>
            <p className="text-lg text-blue-100 mt-1">Start learning!</p>
          </div>
        </button>

        {/* Teacher / Parent — secondary */}
        <button
          onClick={() => navigate("/login")}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-3xl py-7 px-6 flex items-center gap-5 shadow-lg transition-all hover:scale-[1.02] active:scale-95"
        >
          <span className="text-5xl flex-shrink-0">👩‍🏫</span>
          <div className="text-left">
            <p className="text-2xl font-extrabold leading-tight">Teacher / Parent</p>
            <p className="text-base text-yellow-700 mt-1">Manage students</p>
          </div>
        </button>
      </div>

      {/* Footer */}
      <p className="mt-12 text-base text-gray-400 font-medium">
        © {new Date().getFullYear()} DownX — Empowering Every Mind
      </p>
    </div>
  );
};

export default RoleSelectionPage;