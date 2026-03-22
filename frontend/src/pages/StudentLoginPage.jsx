/**
 * StudentLoginPage.jsx
 *
 * DS-FRIENDLY REDESIGN:
 * 1. PIN emoji tiles are now huge (120×120px) with big tap targets
 * 2. Warm sunny background instead of cold indigo
 * 3. Text sizes bumped significantly throughout
 * 4. Face login and PIN login buttons are very large
 * 5. Clear visual feedback at every step
 * 6. Simpler, warmer layout
 */

import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { studentLogin, reset } from "../features/student/studentSlice";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import Confetti from "react-confetti";
import toast from "react-hot-toast";
import LoadingDots from "../components/Loadingdots";
import axios from "axios";

const VISUAL_PINS = ["🌟", "🔥", "💧", "🍀"];

// Friendly warm palette per slot
const SLOT_STYLES = [
  {
    active: "bg-yellow-300 border-yellow-500 shadow-yellow-200",
    inactive: "bg-yellow-100 border-yellow-300",
  },
  {
    active: "bg-orange-300 border-orange-500 shadow-orange-200",
    inactive: "bg-orange-100 border-orange-300",
  },
  {
    active: "bg-pink-300   border-pink-500   shadow-pink-200",
    inactive: "bg-pink-100   border-pink-300",
  },
  {
    active: "bg-green-300  border-green-500  shadow-green-200",
    inactive: "bg-green-100  border-green-300",
  },
];

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
      toast.success("Welcome! 🎉");
      setShowConfetti(true);
      navigate("/student-dashboard", { replace: true });
      setTimeout(() => setShowConfetti(false), 2500);
    }
  }, [loginSuccess, student, navigate]);

  // Error
  useEffect(() => {
    if (isError && !resetCalledRef.current) {
      resetCalledRef.current = true;
      toast.error(message || "Login failed. Try again!");
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
        ? (VISUAL_PINS.indexOf(cur) + 1) % VISUAL_PINS.length
        : 0;
      const next = [...prev];
      next[idx] = VISUAL_PINS[nextIndex];
      return next;
    });
  };

  const handleSubmit = () => {
    if (checkingStudent) return;
    if (!enrollmentId || visualPin.includes("")) {
      toast.error("Please enter your ID and tap all 4 pictures!");
      return;
    }
    navigatedRef.current = false;
    resetCalledRef.current = false;
    dispatch(studentLogin({ enrollmentId, visualPin }));
  };

  const allPinFilled = !visualPin.includes("");

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 via-orange-50 to-white flex flex-col items-center justify-start pt-10 pb-16 px-5 relative">
      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-5 left-5 w-14 h-14 flex items-center justify-center rounded-2xl bg-white shadow-md hover:bg-gray-50 transition"
      >
        <FiArrowLeft className="text-2xl text-gray-600" />
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
        <div className="text-6xl mb-3">👋</div>
        <h1 className="text-4xl font-extrabold text-orange-700">
          Hello! Welcome Back
        </h1>
        <p className="text-xl text-gray-500 mt-2">Type your ID to start</p>
      </div>

      {/* Enrollment ID input */}
      <input
        type="text"
        placeholder="Your ID (e.g. DX-20260001)"
        value={enrollmentId}
        onChange={(e) => setEnrollmentId(e.target.value.toUpperCase())}
        className="w-full max-w-sm p-5 text-2xl text-center rounded-3xl border-4 border-orange-300 bg-white shadow-lg focus:outline-none focus:ring-4 focus:ring-orange-300 placeholder:text-gray-300 mb-6 font-bold tracking-widest"
      />

      {/* Checking indicator */}
      {checkingStudent && (
        <div className="flex flex-col items-center gap-2 mb-6">
          <LoadingDots />
          <p className="text-xl text-gray-500 font-semibold">
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
            className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white text-2xl font-extrabold rounded-3xl shadow-lg flex items-center justify-center gap-3 transition"
          >
            😊 Login with My Face
          </button>
          <button
            onClick={() => setLoginMode("pin")}
            className="w-full py-6 bg-orange-400 hover:bg-orange-500 text-white text-2xl font-extrabold rounded-3xl shadow-lg flex items-center justify-center gap-3 transition"
          >
            🌟 Login with Pictures
          </button>
        </div>
      )}

      {/* PIN only (no face) */}
      {!checkingStudent && faceEnabled === false && !loginMode && (
        <button
          onClick={() => setLoginMode("pin")}
          className="w-full max-w-sm py-7 bg-orange-400 hover:bg-orange-500 text-white text-2xl font-extrabold rounded-3xl shadow-xl flex items-center justify-center gap-3 transition"
        >
          🌟 Login with Pictures
        </button>
      )}

      {/* ── PIN grid ──────────────────────────────────────────────── */}
      {loginMode === "pin" && (
        <div className="w-full max-w-sm flex flex-col items-center gap-6">
          <p className="text-2xl font-extrabold text-gray-700 text-center">
            Tap each picture to choose your secret
          </p>

          {/* 4 large emoji tiles */}
          <div className="grid grid-cols-4 gap-3 w-full">
            {visualPin.map((val, idx) => (
              <button
                key={idx}
                onClick={() => handlePinTap(idx)}
                className={`h-24 text-5xl rounded-3xl border-4 flex items-center justify-center shadow-lg transition-all duration-150 active:scale-95 ${
                  val
                    ? `${SLOT_STYLES[idx].active} shadow-xl`
                    : `${SLOT_STYLES[idx].inactive}`
                }`}
              >
                {val || "❔"}
              </button>
            ))}
          </div>

          {/* Current pin display */}
          <p className="text-xl text-gray-500 font-bold">
            {visualPin.map((v) => v || "❔").join("  →  ")}
          </p>

          {/* GO button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !allPinFilled}
            className={`w-full py-7 text-3xl font-extrabold rounded-3xl shadow-xl flex items-center justify-center gap-3 transition-all ${
              allPinFilled && !isLoading
                ? "bg-green-500 hover:bg-green-600 text-white hover:scale-[1.02]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isLoading ? <LoadingDots /> : "Let's Go! 🚀"}
          </button>

          {/* Back to options */}
          <button
            onClick={() => setLoginMode(null)}
            className="text-xl text-gray-400 hover:text-gray-600 underline transition"
          >
            ← Other login options
          </button>
        </div>
      )}

      {/* Helper text */}
      {!loginMode && !checkingStudent && (
        <p className="mt-8 text-xl text-gray-400 text-center max-w-sm">
          Enter your ID above to see your login options
        </p>
      )}
    </div>
  );
};

export default StudentLoginPage;
