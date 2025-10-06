import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { studentLogin, reset } from "../features/student/studentSlice";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import Confetti from "react-confetti";
import toast from "react-hot-toast";
import LoadingDots from "../components/Loadingdots";

const VISUAL_PINS = ["🌟", "🔥", "💧", "🍀"];
const PIN_COLORS = ["bg-indigo-300", "bg-indigo-400", "bg-indigo-500", "bg-indigo-600"];

const StudentLoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const navigatedRef = useRef(false);
  const resetCalledRef = useRef(false);

  const [enrollmentId, setEnrollmentId] = useState("");
  const [visualPin, setVisualPin] = useState(["", "", "", ""]);
  const [showConfetti, setShowConfetti] = useState(false);

  const { student, isLoading, loginSuccess, isError, message } = useSelector(
    (state) => state.students
  );

  // Login Success Effect
  useEffect(() => {
    if (loginSuccess && student && !navigatedRef.current) {
      navigatedRef.current = true;

      toast.success("Login successful!");
      setShowConfetti(true);

      setTimeout(() => {
        navigate("/student-dashboard", { replace: true });
      }, 100);

      setTimeout(() => setShowConfetti(false), 2000);
    }
  }, [loginSuccess, student, navigate]);

  // Handle Errors
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

  useEffect(() => {
    return () => {
      navigatedRef.current = false;
      resetCalledRef.current = false;
    };
  }, []);

  const handlePinTap = (index) => {
    setVisualPin((prev) => {
      const current = prev[index];
      const nextIndex = current ? (VISUAL_PINS.indexOf(current) + 1) % VISUAL_PINS.length : 0;
      const newSequence = [...prev];
      newSequence[index] = VISUAL_PINS[nextIndex];
      return newSequence;
    });
  };

  const handleSubmit = () => {
    if (!enrollmentId || visualPin.includes("")) {
      toast.error("Please enter your Enrollment ID and complete the visual PIN");
      return;
    }

    navigatedRef.current = false;
    resetCalledRef.current = false;

    dispatch(studentLogin({ enrollmentId, visualPin }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-200 via-indigo-300 to-indigo-500 p-6 relative">
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-100 transition z-50"
        title="Back"
      >
        <FiArrowLeft className="text-xl text-gray-700" />
      </button>

      {showConfetti && <Confetti />}

      <h1 className="text-5xl font-extrabold mb-10 text-gray-900 text-center animate-pulse">
        Welcome!
      </h1>

      <input
        type="text"
        placeholder="Enter Enrollment ID"
        value={enrollmentId}
        onChange={(e) => setEnrollmentId(e.target.value)}
        className="mb-12 p-5 text-2xl text-center rounded-3xl shadow-xl w-80 focus:outline-none focus:ring-8 focus:ring-indigo-400 placeholder:text-gray-500 transition-all duration-300"
      />

      <div className="flex gap-6 mb-12">
        {visualPin.map((val, idx) => (
          <button
            key={idx}
            onClick={() => handlePinTap(idx)}
            className={`w-28 h-28 text-6xl rounded-3xl flex items-center justify-center shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-3xl focus:outline-none focus:ring-6 focus:ring-indigo-300 ${PIN_COLORS[idx]}`}
          >
            {val || "❔"}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="px-20 py-6 text-3xl font-bold bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-3xl shadow-2xl hover:scale-105 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <LoadingDots /> : "GO!"}
      </button>

      <p className="mt-10 text-2xl text-gray-800 text-center max-w-lg">
        Tap the icons in your secret sequence to log in.
      </p>
    </div>
  );
};

export default StudentLoginPage;
