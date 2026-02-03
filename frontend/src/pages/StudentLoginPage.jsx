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
const PIN_COLORS = [
  "bg-indigo-300",
  "bg-indigo-400",
  "bg-indigo-500",
  "bg-indigo-600",
];

const StudentLoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const navigatedRef = useRef(false);
  const resetCalledRef = useRef(false);
  const latestEnrollmentRef = useRef("");

  const [enrollmentId, setEnrollmentId] = useState("");
  const [visualPin, setVisualPin] = useState(["", "", "", ""]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [faceEnabled, setFaceEnabled] = useState(null);
  const [loginMode, setLoginMode] = useState(null);
  const [checkingStudent, setCheckingStudent] = useState(false);

  const { student, isLoading, loginSuccess, isError, message } = useSelector(
    (state) => state.students
  );

  /* ---------------- LOGIN SUCCESS ---------------- */
  useEffect(() => {
    if (loginSuccess && student && !navigatedRef.current) {
      navigatedRef.current = true;

      toast.success("Login successful!");
      setShowConfetti(true);

      navigate("/student-dashboard", { replace: true });

      setTimeout(() => setShowConfetti(false), 2000);
    }
  }, [loginSuccess, student, navigate]);

  /* ---------------- ERROR HANDLING ---------------- */
  useEffect(() => {
    if (isError && !resetCalledRef.current) {
      resetCalledRef.current = true;
      toast.error(message || "Login failed.");

      setTimeout(() => {
        dispatch(reset());
        resetCalledRef.current = false;
      }, 100);
    }
  }, [isError, message, dispatch]);

  /* ---------------- RESET ON UNMOUNT ---------------- */
  useEffect(() => {
    return () => {
      navigatedRef.current = false;
      resetCalledRef.current = false;
    };
  }, []);

  /* ---------------- RESET PIN WHEN ID CHANGES ---------------- */
  useEffect(() => {
    setVisualPin(["", "", "", ""]);
    setLoginMode(null);
  }, [enrollmentId]);

  /* ---------------- VISUAL PIN TAP ---------------- */
  const handlePinTap = (index) => {
    setVisualPin((prev) => {
      const current = prev[index];
      const nextIndex = current
        ? (VISUAL_PINS.indexOf(current) + 1) % VISUAL_PINS.length
        : 0;

      const updated = [...prev];
      updated[index] = VISUAL_PINS[nextIndex];
      return updated;
    });
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = () => {
    if (checkingStudent) return;

    if (!enrollmentId || visualPin.includes("")) {
      toast.error(
        "Please enter your Enrollment ID and complete the visual PIN"
      );
      return;
    }

    navigatedRef.current = false;
    resetCalledRef.current = false;

    dispatch(studentLogin({ enrollmentId, visualPin }));
  };

  /* ---------------- CHECK LOGIN OPTIONS ---------------- */
  useEffect(() => {
    if (!enrollmentId || enrollmentId.length < 3) {
      setFaceEnabled(null);
      setCheckingStudent(false);
      return;
    }

    latestEnrollmentRef.current = enrollmentId;
    setCheckingStudent(true);

    const timeout = setTimeout(async () => {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/students/login-options`,
          {
            enrollmentId,
          }
        );

        if (latestEnrollmentRef.current === enrollmentId) {
          setFaceEnabled(res.data.faceEnabled);
        }
      } catch (err) {
        console.error(err);
        setFaceEnabled(null);
      } finally {
        if (latestEnrollmentRef.current === enrollmentId) {
          setCheckingStudent(false);
        }
      }
    }, 700);

    return () => clearTimeout(timeout);
  }, [enrollmentId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-200 via-indigo-300 to-indigo-500 p-6 relative">
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-100 transition z-50"
        title="Back"
      >
        <FiArrowLeft className="text-xl text-gray-700" />
      </button>

      {showConfetti && (
        <Confetti width={window.innerWidth} height={window.innerHeight} />
      )}

      <h1 className="text-5xl font-extrabold mb-10 text-gray-900 text-center animate-pulse">
        Welcome!
      </h1>

      <input
        type="text"
        placeholder="Enter Enrollment ID"
        value={enrollmentId}
        onChange={(e) => setEnrollmentId(e.target.value)}
        className="mb-12 p-5 text-2xl text-center rounded-3xl shadow-xl w-80 focus:outline-none focus:ring-8 focus:ring-indigo-400 placeholder:text-gray-500"
      />

      {checkingStudent && (
        <div className="mt-6 text-center">
          <LoadingDots />
          <p className="mt-2 text-lg text-gray-700">
            Checking student details…
          </p>
        </div>
      )}

      {/* ----------- PIN LOGIN UI ----------- */}
      {loginMode === "pin" && (
        <>
          <div className="flex gap-6 mb-12 mt-10">
            {visualPin.map((val, idx) => (
              <button
                key={idx}
                onClick={() => handlePinTap(idx)}
                className={`w-28 h-28 text-6xl rounded-3xl flex items-center justify-center shadow-2xl transform transition hover:scale-110 ${PIN_COLORS[idx]}`}
              >
                {val || "❔"}
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-20 py-6 text-3xl font-bold bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-3xl shadow-2xl"
          >
            {isLoading ? <LoadingDots /> : "GO!"}
          </button>
        </>
      )}

      {/* ----------- FACE ENABLED ----------- */}
      {!checkingStudent && faceEnabled === true && (
        <div className="mt-8 space-y-4 w-full max-w-sm">
          <button
            onClick={() =>
              navigate(`/student-face-login?enrollmentId=${enrollmentId}`)
            }
            className="w-full py-6 bg-indigo-950 text-white text-2xl rounded-2xl shadow-lg"
          >
            Login with Face
          </button>

          <button
            onClick={() => setLoginMode("pin")}
            className="w-full py-6 bg-indigo-600 text-white text-2xl rounded-2xl shadow-lg"
          >
            Login with Visual PIN
          </button>
        </div>
      )}

      {/* ----------- FACE DISABLED ----------- */}
      {!checkingStudent && faceEnabled === false && (
        <div className="mt-8 w-full max-w-sm">
          <button
            onClick={() => setLoginMode("pin")}
            className="w-full py-6 bg-indigo-600 text-white text-2xl rounded-2xl shadow-lg"
          >
            Login with Visual PIN
          </button>
        </div>
      )}

      <p className="mt-10 text-2xl text-gray-800 text-center max-w-lg">
        Tap the icons in your secret sequence to log in.
      </p>
    </div>
  );
};

export default StudentLoginPage;
