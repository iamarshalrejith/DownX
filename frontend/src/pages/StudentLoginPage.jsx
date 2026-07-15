/**
 * StudentLoginPage.jsx
 *
 * DownX design system applied:
 * - Atkinson Hyperlegible, calm warm-neutral palette (no saturated
 *   "kids app" colors)
 * - PIN tiles use the shared ring-badge icon system instead of raw
 *   emoji — see utils/visualPinDisplay.js. Stored PIN values are
 *   unchanged, so this is a display-only change.
 * - Larger, unambiguous touch targets; clear step-by-step language
 */

import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { studentLogin, reset } from "../features/student/studentSlice";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiHelpCircle, FiUser } from "react-icons/fi";
import Confetti from "react-confetti";
import toast from "react-hot-toast";
import LoadingDots from "../components/Loadingdots";
import axios from "axios";
import { VISUAL_PIN_VALUES, VISUAL_PIN_DISPLAY } from "../utils/visualPinDisplay";

const StudentLoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const navigatedRef = useRef(false);
  const resetCalledRef = useRef(false);
  const latestEnrollRef = useRef("");

  const [enrollmentId, setEnrollmentId] = useState("");
  const [visualPin, setVisualPin] = useState(["", "", "", ""]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [faceEnabled, setFaceEnabled] = useState(null);
  const [loginMode, setLoginMode] = useState(null); // null | "pin"
  const [checkingStudent, setCheckingStudent] = useState(false);

  const { student, isLoading, loginSuccess, isError, message } = useSelector(
    (s) => s.students,
  );

  // Login success
  useEffect(() => {
    if (loginSuccess && student && !navigatedRef.current) {
      navigatedRef.current = true;
      toast.success("Welcome back!");
      setShowConfetti(true);
      navigate("/student-dashboard", { replace: true });
      setTimeout(() => setShowConfetti(false), 2500);
    }
  }, [loginSuccess, student, navigate]);

  // Error
  useEffect(() => {
    if (isError && !resetCalledRef.current) {
      resetCalledRef.current = true;
      toast.error(message || "That didn't work. Please try again.");
      setTimeout(() => {
        dispatch(reset());
        resetCalledRef.current = false;
      }, 100);
    }
  }, [isError, message, dispatch]);

  useEffect(
    () => () => {
      navigatedRef.current = false;
      resetCalledRef.current = false;
    },
    [],
  );

  // Reset PIN when enrollment ID changes
  useEffect(() => {
    setVisualPin(["", "", "", ""]);
    setLoginMode(null);
  }, [enrollmentId]);

  // Debounced student lookup
  useEffect(() => {
    if (!enrollmentId || enrollmentId.length < 3) {
      setFaceEnabled(null);
      setCheckingStudent(false);
      return;
    }
    latestEnrollRef.current = enrollmentId;
    setCheckingStudent(true);

    const t = setTimeout(async () => {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/students/login-options`,
          { enrollmentId },
        );
        if (latestEnrollRef.current === enrollmentId)
          setFaceEnabled(res.data.faceEnabled);
      } catch {
        setFaceEnabled(null);
      } finally {
        if (latestEnrollRef.current === enrollmentId) setCheckingStudent(false);
      }
    }, 700);

    return () => clearTimeout(t);
  }, [enrollmentId]);

  const handlePinTap = (idx) => {
    setVisualPin((prev) => {
      const cur = prev[idx];
      const nextIndex = cur
        ? (VISUAL_PIN_VALUES.indexOf(cur) + 1) % VISUAL_PIN_VALUES.length
        : 0;
      const next = [...prev];
      next[idx] = VISUAL_PIN_VALUES[nextIndex];
      return next;
    });
  };

  const handleSubmit = () => {
    if (checkingStudent) return;
    if (!enrollmentId || visualPin.includes("")) {
      toast.error("Enter your ID and choose all 4 pictures first.");
      return;
    }
    navigatedRef.current = false;
    resetCalledRef.current = false;
    dispatch(studentLogin({ enrollmentId, visualPin }));
  };

  const allPinFilled = !visualPin.includes("");

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-start pt-10 pb-16 px-5 relative">
      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        aria-label="Go back"
        className="absolute top-5 left-5 w-12 h-12 flex items-center justify-center rounded-full bg-surface border-2 border-border hover:bg-brand-light transition-colors focus-visible:outline focus-visible:outline-3"
      >
        <FiArrowLeft size={22} className="text-ink" />
      </button>

      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
        />
      )}

      {/* Welcome heading */}
      <div className="text-center mb-8 mt-6">
        <div
          className="mx-auto mb-4 w-14 h-14 rounded-full bg-surface flex items-center justify-center"
          style={{ boxShadow: "0 0 0 3px var(--color-brand)" }}
          aria-hidden="true"
        >
          <FiUser size={24} className="text-brand" />
        </div>
        <h1 className="text-3xl font-extrabold text-ink">Welcome back</h1>
        <p className="text-lg text-ink-soft mt-2">Type your ID to start</p>
      </div>

      {/* Enrollment ID input */}
      <label htmlFor="enrollmentId" className="sr-only">
        Student ID
      </label>
      <input
        id="enrollmentId"
        type="text"
        placeholder="Your ID (e.g. DX-20260001)"
        value={enrollmentId}
        onChange={(e) => setEnrollmentId(e.target.value.toUpperCase())}
        className="w-full max-w-sm p-5 text-xl text-center rounded-2xl border-2 border-border bg-surface shadow-sm focus:outline-none focus-visible:outline focus-visible:outline-3 placeholder:text-ink-soft/60 mb-6 font-bold tracking-widest"
      />

      {/* Checking indicator */}
      {checkingStudent && (
        <div className="flex flex-col items-center gap-2 mb-6">
          <LoadingDots />
          <p className="text-lg text-ink-soft font-semibold">
            Looking for your account…
          </p>
        </div>
      )}

      {/* ── Login options ─────────────────────────────────────────── */}

      {/* Face login option */}
      {!checkingStudent && faceEnabled === true && !loginMode && (
        <div className="w-full max-w-sm flex flex-col gap-4 mb-2">
          <button
            onClick={() =>
              navigate(`/student-face-login?enrollmentId=${enrollmentId}`)
            }
            className="w-full py-6 bg-brand hover:bg-brand-dark text-white text-xl font-extrabold rounded-2xl shadow-sm transition-colors focus-visible:outline focus-visible:outline-3"
          >
            Log in with my face
          </button>
          <button
            onClick={() => setLoginMode("pin")}
            className="w-full py-6 bg-surface hover:bg-accent-light text-ink border-2 border-border text-xl font-extrabold rounded-2xl shadow-sm transition-colors focus-visible:outline focus-visible:outline-3"
          >
            Log in with pictures
          </button>
        </div>
      )}

      {/* PIN only (no face) */}
      {!checkingStudent && faceEnabled === false && !loginMode && (
        <button
          onClick={() => setLoginMode("pin")}
          className="w-full max-w-sm py-7 bg-brand hover:bg-brand-dark text-white text-xl font-extrabold rounded-2xl shadow-sm transition-colors focus-visible:outline focus-visible:outline-3"
        >
          Log in with pictures
        </button>
      )}

      {/* ── PIN grid ──────────────────────────────────────────────── */}
      {loginMode === "pin" && (
        <div className="w-full max-w-sm flex flex-col items-center gap-6">
          <p className="text-xl font-bold text-ink text-center">
            Tap each picture to choose your secret code
          </p>

          {/* 4 ring-badge tiles */}
          <div className="grid grid-cols-4 gap-3 w-full">
            {visualPin.map((val, idx) => {
              const display = val ? VISUAL_PIN_DISPLAY[val] : null;
              const Icon = display?.Icon || FiHelpCircle;
              return (
                <button
                  key={idx}
                  onClick={() => handlePinTap(idx)}
                  aria-label={
                    display ? `Slot ${idx + 1}: ${display.label}` : `Slot ${idx + 1}: empty`
                  }
                  className={`h-20 rounded-2xl border-2 flex items-center justify-center shadow-sm transition-all active:scale-95 focus-visible:outline focus-visible:outline-3 ${
                    display
                      ? `${display.bg} border-transparent ring-2 ${display.ring}`
                      : "bg-surface border-border"
                  }`}
                >
                  <Icon
                    size={30}
                    className={display ? display.icon : "text-ink-soft"}
                  />
                </button>
              );
            })}
          </div>

          {/* Current pin labels, for confirmation */}
          <p className="text-base text-ink-soft font-semibold text-center">
            {visualPin
              .map((v) => (v ? VISUAL_PIN_DISPLAY[v].label : "empty"))
              .join("  •  ")}
          </p>

          {/* GO button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !allPinFilled}
            className={`w-full py-6 text-2xl font-extrabold rounded-2xl shadow-sm transition-colors focus-visible:outline focus-visible:outline-3 ${
              allPinFilled && !isLoading
                ? "bg-success hover:bg-success/90 text-white"
                : "bg-border text-ink-soft cursor-not-allowed"
            }`}
          >
            {isLoading ? <LoadingDots /> : "Continue"}
          </button>

          {/* Back to options */}
          <button
            onClick={() => setLoginMode(null)}
            className="text-lg text-ink-soft hover:text-ink underline transition-colors focus-visible:outline focus-visible:outline-3"
          >
            Other login options
          </button>
        </div>
      )}

      {/* Helper text */}
      {!loginMode && !checkingStudent && (
        <p className="mt-8 text-lg text-ink-soft text-center max-w-sm">
          Enter your ID above to see your login options
        </p>
      )}
    </div>
  );
};

export default StudentLoginPage;