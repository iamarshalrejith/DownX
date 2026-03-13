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
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaArrowRight,
  FaRedo,
  FaCheck,
  FaStar,
} from "react-icons/fa";

/**
 * Decode enrollmentId from the studentToken JWT
 * Payload: { id, enrollmentId, iat, exp }
 */
const getEnrollmentIdFromToken = (token) => {
  try {
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.enrollmentId || null;
  } catch {
    return null;
  }
};

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);
  const {
    tasks = [],
    loading,
    error,
    verifiedTasks,
  } = useSelector((state) => state.task);

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [currentSteps, setCurrentSteps] = useState({});
  const [showCompleted, setShowCompleted] = useState(false);

  const activeToken = localStorage.getItem("studentToken") || user?.token;
  const enrollmentId = useMemo(() => {
    const studentToken = localStorage.getItem("studentToken");
    return getEnrollmentIdFromToken(studentToken) || user?.enrollmentId || null;
  }, [user]);

  // Load tasks
  useEffect(() => {
    if (activeToken) {
      dispatch(getAllTasks(activeToken));
    } else {
      navigate("/student-login");
    }
  }, [dispatch, activeToken, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("studentToken");
    dispatch(logout());
    dispatch(resetStudent());
    navigate("/", { replace: true });
  };

  //  Task helpers
  const filteredTasks = tasks.filter((t) =>
    showCompleted ? t.isCompletedByMe : !t.isCompletedByMe,
  );
  const currentTask = filteredTasks[currentTaskIndex];
  const taskId = currentTask?._id;
  const steps = currentTask?.simplifiedSteps || [];
  const currentStep = currentSteps[taskId] || 0;
  const isTaskDone = currentTask?.isCompletedByMe;

  // Object verification for current task
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
    if (activeToken && taskId)
      dispatch(markTaskComplete({ id: taskId, token: activeToken }));
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
      verifiedLabels.forEach((label) => (scores[label] = 1.0));

      dispatch(
        verifyObjectForTask({
          taskId,
          enrollmentId,
          detectedObjects: verifiedLabels,
          confidenceScores: scores,
        }),
      );

      toast.success("📷 Task objects verified!", { duration: 3000 });
    },
    [taskId, enrollmentId, dispatch],
  );

  //  Loading / Error
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
    <div className="flex flex-col items-center justify-start min-h-screen bg-yellow-50 p-6 pb-32">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-blue-800">
          Hi {user?.name || "Student"}! 👋
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          Log Out
        </button>
      </div>

      {/* Tab Toggle */}
      <div className="flex justify-center gap-4 mb-6">
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
            className={`px-6 py-3 text-lg font-bold rounded-full transition ${
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
              : "All tasks are completed! "}
          </p>
        </div>
      ) : (
        <div className="w-full max-w-xl bg-white shadow-lg rounded-2xl p-6 text-center border-4 border-blue-400">
          <h2 className="text-2xl font-bold text-blue-700 mb-2">
            Task {currentTaskIndex + 1} of {filteredTasks.length}
          </h2>
          <h3 className="text-xl font-semibold text-gray-800 mb-1">
            {currentTask.title || "Untitled Task"}
          </h3>
          <p className="text-md text-gray-600 mb-4">
            {currentTask.description || "No description provided."}
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
              <p className="mb-4">Great job! You finished this task! </p>
              <button
                onClick={handleUndoTask}
                className="bg-yellow-500 hover:bg-yellow-600 text-white text-lg font-semibold py-2 px-5 rounded-lg flex items-center gap-2"
              >
                <FaArrowLeft /> Undo – pressed by mistake
              </button>
            </div>
          ) : (
            <>
              <h4 className="text-lg font-bold text-gray-800 mb-3">
                Step {currentStep + 1} of {steps.length}
              </h4>
              <p className="bg-blue-100 text-blue-900 border-2 border-blue-400 rounded-xl p-5 text-lg mb-5">
                {steps[currentStep]}
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                  className={`w-full py-3 text-lg rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                    currentStep === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  <FaArrowLeft /> Go Back
                </button>

                <button
                  onClick={handleReset}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-lg font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <FaRedo /> Start Over
                </button>

                <button
                  onClick={handleNextStep}
                  disabled={currentStep === steps.length - 1}
                  className={`w-full py-3 text-lg rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
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
                className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white text-2xl font-extrabold py-5 rounded-full flex items-center justify-center gap-3 shadow-lg transition-all transform hover:scale-105 focus:ring-4 focus:ring-green-300"
              >
                I Did It! <FaCheck size={28} />
              </button>
            </>
          )}

          {/* Task Navigation */}
          <div className="flex justify-between mt-6">
            <button
              onClick={handlePrevTask}
              disabled={currentTaskIndex === 0}
              className={`px-5 py-2 rounded-lg text-lg font-semibold flex items-center gap-2 transition ${
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
              className={`px-5 py-2 rounded-lg text-lg font-semibold flex items-center gap-2 transition ${
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

      {/* Gesture Detector  */}
      <GestureDetector
        enrollmentId={enrollmentId}
        taskId={taskId || null}
        isEnabled={true}
        onGestureDetected={(gestureType, data) => {
          console.log("Gesture logged:", gestureType, data);
        }}
      />

      {/* Object Detector  */}
      <ObjectDetector
        requiredObjects={objVerification?.requiredObjects || []}
        taskId={taskId || null}
        isEnabled={true}
        onVerified={handleObjectsVerified}
      />
    </div>
  );
};

export default StudentDashboard;
