import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import { reset as resetStudent } from "../features/student/studentSlice";
import {
  getAllTasks,
  markTaskComplete,
  unmarkTaskComplete,
  verifyObjectForTask,
} from "../features/task/taskSlice";
import GestureDetector from "../components/gesture/GestureDetector";
import ObjectDetector from "../components/object/ObjectDetector";
import SpeechTherapy from "../components/speech/SpeechTherapy";
import PictogramBoard from "../components/PictogramBoard";
import PointsBadge from "../components/PointsBadge";
import toast from "react-hot-toast";
import axios from "axios";
import {
  FaArrowLeft,
  FaArrowRight,
  FaRedo,
  FaCheck,
  FaStar,
} from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_API_URL;

const getEnrollmentIdFromToken = (token) => {
  try {
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1])).enrollmentId || null;
  } catch {
    return null;
  }
};

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((s) => s.auth.user);
  const {
    tasks = [],
    loading,
    error,
    verifiedTasks,
  } = useSelector((s) => s.task);

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [currentSteps, setCurrentSteps] = useState({});
  const [showCompleted, setShowCompleted] = useState(false);
  const [pointsRefresh, setPointsRefresh] = useState(0); // bump to refetch badge

  const activeToken = localStorage.getItem("studentToken") || user?.token;
  const enrollmentId = useMemo(() => {
    const st = localStorage.getItem("studentToken");
    return getEnrollmentIdFromToken(st) || user?.enrollmentId || null;
  }, [user]);

  // Load tasks
  useEffect(() => {
    if (activeToken) dispatch(getAllTasks(activeToken));
    else navigate("/student-login");
  }, [dispatch, activeToken, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("studentToken");
    dispatch(logout());
    dispatch(resetStudent());
    navigate("/", { replace: true });
  };

  // Task helpers
  const filteredTasks = tasks.filter((t) =>
    showCompleted ? t.isCompletedByMe : !t.isCompletedByMe,
  );
  const currentTask = filteredTasks[currentTaskIndex];
  const taskId = currentTask?._id;
  const steps = currentTask?.simplifiedSteps || [];
  const currentStep = currentSteps[taskId] || 0;
  const isTaskDone = currentTask?.isCompletedByMe;
  const objVerification = currentTask?.objectVerification;
  const objVerifyEnabled =
    objVerification?.enabled && objVerification?.requiredObjects?.length > 0;
  const isObjVerified = verifiedTasks?.[taskId] || false;

  const handleNextStep = () => {
    if (currentStep < steps.length - 1)
      setCurrentSteps((p) => ({ ...p, [taskId]: currentStep + 1 }));
  };
  const handlePrevStep = () => {
    if (currentStep > 0)
      setCurrentSteps((p) => ({ ...p, [taskId]: currentStep - 1 }));
  };
  const handleReset = () => setCurrentSteps((p) => ({ ...p, [taskId]: 0 }));

  const handleTaskDone = () => {
    if (!activeToken || !taskId) return;
    dispatch(markTaskComplete({ id: taskId, token: activeToken }));

    // Award gamification points for completing task
    if (enrollmentId) {
      axios
        .post(`${BASE_URL}/api/gamification/award`, {
          enrollmentId,
          event: "task_complete",
          taskId,
        })
        .then((res) => {
          if (res.data.pointsAwarded > 0) {
            toast.success(`🌟 +${res.data.pointsAwarded} points!`, {
              duration: 2500,
            });
            setPointsRefresh((n) => n + 1);
          }
        })
        .catch(() => {});
    }
  };

  const handleUndoTask = () => {
    if (activeToken && taskId)
      dispatch(unmarkTaskComplete({ id: taskId, token: activeToken }));
  };

  const handleNextTask = () => {
    if (currentTaskIndex < filteredTasks.length - 1)
      setCurrentTaskIndex((p) => p + 1);
  };
  const handlePrevTask = () => {
    if (currentTaskIndex > 0) setCurrentTaskIndex((p) => p - 1);
  };

  // Object verified callback
  const handleObjectsVerified = useCallback(
    (verifiedLabels) => {
      if (!taskId || !enrollmentId) return;
      const scores = {};
      verifiedLabels.forEach((l) => (scores[l] = 1.0));
      dispatch(
        verifyObjectForTask({
          taskId,
          enrollmentId,
          detectedObjects: verifiedLabels,
          confidenceScores: scores,
        }),
      );
      toast.success("📷 Objects verified!", { duration: 3000 });

      // Award points
      axios
        .post(`${BASE_URL}/api/gamification/award`, {
          enrollmentId,
          event: "object_verified",
          taskId,
        })
        .then(() => setPointsRefresh((n) => n + 1))
        .catch(() => {});
    },
    [taskId, enrollmentId, dispatch],
  );

  // Speech earned points callback
  const handleSpeechPoints = useCallback((pts) => {
    toast.success(`🎤 +${pts} points for great speech!`, { duration: 2500 });
    setPointsRefresh((n) => n + 1);
  }, []);

  // Pictogram step done callback
  const handlePictogramStepDone = useCallback(
    (stepIndex) => {
      if (stepIndex < steps.length - 1)
        setCurrentSteps((p) => ({ ...p, [taskId]: stepIndex + 1 }));
    },
    [steps.length, taskId],
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4" />
        <p className="text-xl text-blue-800 font-bold">Getting your tasks…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-50 text-center px-4">
        <p className="text-red-600 font-semibold text-lg mb-2">
          Oops! Something went wrong.
        </p>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => {
            if (activeToken) dispatch(getAllTasks(activeToken));
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg mb-3"
        >
          Try Again
        </button>
        <button
          onClick={() => navigate("/student-login")}
          className="text-blue-600 underline text-sm"
        >
          Back to Login
        </button>
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-50">
        <p className="text-gray-700 text-xl font-semibold">
          No tasks right now 🌟
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-yellow-50 p-4 pb-40">
      {/* Header */}
      <div className="w-full max-w-xl flex justify-between items-center mb-4">
        <h1 className="text-2xl font-extrabold text-blue-800">
          Hi {user?.name || "Student"}! 👋
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition text-sm"
        >
          Log Out
        </button>
      </div>

      {/* Points Badge */}
      {enrollmentId && (
        <div className="w-full max-w-xl mb-4">
          <PointsBadge enrollmentId={enrollmentId} refresh={pointsRefresh} />
        </div>
      )}

      {/* Tab Toggle */}
      <div className="flex justify-center gap-4 mb-4 w-full max-w-xl">
        {[
          {
            label: "Active Tasks",
            active: !showCompleted,
            color: "blue",
            onClick: () => {
              setShowCompleted(false);
              setCurrentTaskIndex(0);
            },
          },
          {
            label: "Completed Tasks",
            active: showCompleted,
            color: "green",
            onClick: () => {
              setShowCompleted(true);
              setCurrentTaskIndex(0);
            },
          },
        ].map(({ label, active, color, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className={`flex-1 py-2.5 text-base font-bold rounded-full transition ${
              active
                ? `bg-${color}-600 text-white`
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Task Card */}
      {!filteredTasks.length ? (
        <div className="bg-white shadow-lg rounded-2xl p-10 border-4 border-blue-400 max-w-xl w-full text-center">
          <p className="text-gray-700 text-xl font-semibold">
            {showCompleted
              ? "No completed tasks yet!"
              : "All tasks are done! 🎉"}
          </p>
        </div>
      ) : (
        <div className="w-full max-w-xl bg-white shadow-lg rounded-2xl p-5 border-4 border-blue-400">
          <h2 className="text-xl font-bold text-blue-700 mb-1 text-center">
            Task {currentTaskIndex + 1} of {filteredTasks.length}
          </h2>
          <h3 className="text-lg font-semibold text-gray-800 mb-1 text-center">
            {currentTask.title || "Untitled Task"}
          </h3>
          <p className="text-sm text-gray-500 mb-4 text-center">
            {currentTask.description || ""}
          </p>

          {/* Object verification banner */}
          {objVerifyEnabled && !isTaskDone && (
            <div
              className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${
                isObjVerified
                  ? "bg-green-100 border border-green-400 text-green-700"
                  : "bg-purple-50 border border-purple-300 text-purple-700"
              }`}
            >
              <span className="text-lg">{isObjVerified ? "✅" : "📷"}</span>
              <span>
                {isObjVerified
                  ? "Objects verified by camera!"
                  : objVerification.verificationInstruction ||
                    `Show to camera: ${objVerification.requiredObjects.join(", ")}`}
              </span>
            </div>
          )}

          {isTaskDone ? (
            <div className="p-4 bg-green-100 border-2 border-green-500 rounded-xl text-green-700 font-bold text-lg flex flex-col items-center">
              <FaStar className="text-green-600 mb-3" size={35} />
              <p className="mb-4">Great job! You finished this task! 🎉</p>
              <button
                onClick={handleUndoTask}
                className="bg-yellow-500 hover:bg-yellow-600 text-white text-base font-semibold py-2 px-5 rounded-lg flex items-center gap-2 transition"
              >
                <FaArrowLeft /> Undo – pressed by mistake
              </button>
            </div>
          ) : (
            <>
              {/* PICTOGRAM BOARD — visual step cards */}
              <PictogramBoard
                steps={steps}
                currentStep={currentStep}
                onStepDone={handlePictogramStepDone}
              />

              {/* Step nav buttons */}
              <div className="flex flex-col gap-2 mt-4">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                  className={`w-full py-3 text-base rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                    currentStep === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  <FaArrowLeft /> Go Back
                </button>

                <button
                  onClick={handleReset}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-base font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <FaRedo /> Start Over
                </button>

                <button
                  onClick={handleNextStep}
                  disabled={currentStep === steps.length - 1}
                  className={`w-full py-3 text-base rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                    currentStep === steps.length - 1
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Next Step <FaArrowRight />
                </button>
              </div>

              <button
                onClick={handleTaskDone}
                className="w-full mt-5 bg-green-600 hover:bg-green-700 text-white text-2xl font-extrabold py-5 rounded-full flex items-center justify-center gap-3 shadow-lg transition-all transform hover:scale-105 focus:ring-4 focus:ring-green-300"
              >
                I Did It! <FaCheck size={26} />
              </button>
            </>
          )}

          {/* Task navigation */}
          <div className="flex justify-between mt-5">
            <button
              onClick={handlePrevTask}
              disabled={currentTaskIndex === 0}
              className={`px-4 py-2 rounded-lg text-base font-semibold flex items-center gap-2 transition ${
                currentTaskIndex === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              <FaArrowLeft /> Previous
            </button>
            <button
              onClick={handleNextTask}
              disabled={currentTaskIndex === filteredTasks.length - 1}
              className={`px-4 py-2 rounded-lg text-base font-semibold flex items-center gap-2 transition ${
                currentTaskIndex === filteredTasks.length - 1
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Next <FaArrowRight />
            </button>
          </div>
        </div>
      )}

      {/* Gesture Detector */}
      <GestureDetector
        enrollmentId={enrollmentId}
        taskId={taskId || null}
        isEnabled={true}
        onGestureDetected={(g, d) => console.log("Gesture:", g, d)}
      />

      {/* Object Detector */}
      <ObjectDetector
        requiredObjects={objVerification?.requiredObjects || []}
        taskId={taskId || null}
        isEnabled={true}
        onVerified={handleObjectsVerified}
      />

      {/* Speech Therapy — floating bottom-right */}
      <SpeechTherapy
        stepText={steps[currentStep] || ""}
        stepIndex={currentStep}
        taskId={taskId || null}
        enrollmentId={enrollmentId}
        onPointsEarned={handleSpeechPoints}
      />
    </div>
  );
};

export default StudentDashboard;
