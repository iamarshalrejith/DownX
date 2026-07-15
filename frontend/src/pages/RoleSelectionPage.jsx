/**
 * RoleSelectionPage.jsx
 *
 * Entry point of the app. Redesigned around the DownX design system:
 * - Atkinson Hyperlegible throughout (built for reading accessibility)
 * - Calm, warm-neutral palette — no saturated "kids app" colors
 * - Icons via react-icons in a consistent "ring badge", never emoji
 * - Large, unambiguous touch targets with clear text labels
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { FiBookOpen, FiUsers } from "react-icons/fi";

const RoleSelectionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5 py-12">
      {/* Wordmark */}
      <div className="text-center mb-12">
        <div
          className="mx-auto mb-5 w-16 h-16 rounded-full bg-surface flex items-center justify-center"
          style={{ boxShadow: "0 0 0 3px var(--color-brand)" }}
          aria-hidden="true"
        >
          <FiBookOpen size={28} className="text-brand" />
        </div>
        <h1 className="text-4xl font-extrabold text-ink tracking-tight">
          DownX
        </h1>
        <p className="text-lg text-ink-soft mt-2">
          A calmer way to learn
        </p>
      </div>

      <p className="text-2xl font-bold text-ink mb-6 text-center">
        Who's using DownX today?
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        {/* Student — primary path */}
        <button
          onClick={() => navigate("/student-login")}
          className="w-full bg-brand hover:bg-brand-dark text-white rounded-2xl py-7 px-6 flex items-center gap-5 shadow-sm transition-colors focus-visible:outline focus-visible:outline-3"
        >
          <span
            className="flex-shrink-0 w-14 h-14 rounded-full bg-white/15 flex items-center justify-center"
            aria-hidden="true"
          >
            <FiBookOpen size={26} />
          </span>
          <span className="text-left">
            <span className="block text-2xl font-extrabold leading-tight">
              I'm a Student
            </span>
            <span className="block text-base text-white/80 mt-1">
              Go to my learning page
            </span>
          </span>
        </button>

        {/* Teacher / Parent — secondary path */}
        <button
          onClick={() => navigate("/login")}
          className="w-full bg-surface hover:bg-accent-light text-ink rounded-2xl py-6 px-6 flex items-center gap-5 border-2 border-border transition-colors focus-visible:outline focus-visible:outline-3"
        >
          <span
            className="flex-shrink-0 w-12 h-12 rounded-full bg-accent-light flex items-center justify-center"
            aria-hidden="true"
          >
            <FiUsers size={22} className="text-accent-dark" />
          </span>
          <span className="text-left">
            <span className="block text-xl font-bold leading-tight">
              I'm a Teacher or Parent
            </span>
            <span className="block text-sm text-ink-soft mt-1">
              Manage students and tasks
            </span>
          </span>
        </button>
      </div>

      <p className="mt-14 text-sm text-ink-soft">
        © {new Date().getFullYear()} DownX
      </p>
    </div>
  );
};

export default RoleSelectionPage;