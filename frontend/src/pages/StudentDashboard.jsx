import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import { reset as resetStudent } from "../features/student/studentSlice";
import {
  getAllTasks,
  markTaskComplete,
  unmarkTaskComplete,
} from "../features/task/taskSlice";
import {
  FaArrowLeft,
  FaArrowRight,
  FaRedo,
  FaCheck,
  FaStar,
} from "react-icons/fa";

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);
  const { tasks, loading, error } = useSelector((state) => state.task);

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [currentSteps, setCurrentSteps] = useState({});
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    if (user?.token) {
      dispatch(getAllTasks(user.token));
    } else {
      navigate("/student-login");
    }
  }, [dispatch, user, navigate]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetStudent());
    navigate("/", { replace: true });
  };

  const filteredTasks = tasks.filter((task) =>
    showCompleted ? task.isCompleted : !task.isCompleted
  );

  const currentTask = filteredTasks[currentTaskIndex];
  const taskId = currentTask?._id || currentTask?.id;
  const steps = currentTask?.simplifiedSteps || [];
  const currentStep = currentSteps[taskId] || 0;
  const isTaskDone = currentTask?.isCompleted;

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentSteps((prev) => ({ ...prev, [taskId]: currentStep + 1 }));
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentSteps((prev) => ({ ...prev, [taskId]: currentStep - 1 }));
    }
  };

  const handleReset = () => {
    setCurrentSteps((prev) => ({ ...prev, [taskId]: 0 }));
  };

  const handleTaskDone = () => {
    dispatch(markTaskComplete({ id: taskId, token: user.token }));
  };

  const handleUndoTask = () => {
    dispatch(unmarkTaskComplete({ id: taskId, token: user.token }));
  };

  const handleNextTask = () => {
    if (currentTaskIndex < filteredTasks.length - 1) {
      setCurrentTaskIndex((prev) => prev + 1);
    }
  };

  const handlePrevTask = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex((prev) => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-xl text-blue-800 font-bold">Getting your tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-50 text-center">
        <p className="text-red-600 font-semibold text-lg mb-4">
          Oops! Something went wrong.
        </p>
        <button
          onClick={() => dispatch(getAllTasks(user.token))}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-50">
        <p className="text-gray-700 text-xl font-semibold">No tasks right now</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-yellow-50 p-6">
      {/* Header and Logout */}
      <div className="w-full flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-blue-800">
          Hi {user?.name}!
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
        >
          Log Out
        </button>
      </div>

      {/* Toggle Buttons */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => {
            setShowCompleted(false);
            setCurrentTaskIndex(0);
          }}
          className={`px-6 py-3 text-lg font-bold rounded-full ${
            !showCompleted
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
        >
          Active Tasks
        </button>
        <button
          onClick={() => {
            setShowCompleted(true);
            setCurrentTaskIndex(0);
          }}
          className={`px-6 py-3 text-lg font-bold rounded-full ${
            showCompleted
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
        >
          Completed Tasks
        </button>
      </div>

      {/* Show message if no tasks in current filter */}
      {!filteredTasks.length ? (
        <div className="flex flex-col items-center justify-center bg-white shadow-lg rounded-2xl p-10 border-4 border-blue-400 max-w-xl w-full">
          <p className="text-gray-700 text-xl font-semibold text-center">
            {showCompleted
              ? "No completed tasks yet!"
              : "All tasks are completed!"}
          </p>
        </div>
      ) : (
        <div className="w-full max-w-xl bg-white shadow-lg rounded-2xl p-6 text-center border-4 border-blue-400">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">
            Task {currentTaskIndex + 1} of {filteredTasks.length}
          </h2>

          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {currentTask.title || "Untitled Task"}
          </h3>

          <p className="text-md text-gray-600 mb-6">
            {currentTask.description || "No description provided."}
          </p>

          {/* Task Completion States */}
          {isTaskDone ? (
            <div className="p-4 bg-green-100 border-2 border-green-500 rounded-xl text-green-700 font-bold text-lg flex flex-col items-center">
              <FaStar className="text-green-600 mb-3" size={35} />
              <p className="mb-4">Great job! You finished this task!</p>
              <button
                onClick={handleUndoTask}
                className="bg-yellow-500 hover:bg-yellow-600 text-white text-lg font-semibold py-2 px-5 rounded-lg flex items-center gap-2"
              >
                <FaArrowLeft /> Undo – I pressed by mistake
              </button>
            </div>
          ) : (
            <>
              <h4 className="text-lg font-bold text-gray-800 mb-3">
                Step {currentStep + 1} of {steps.length}
              </h4>

              <p className="bg-blue-100 text-blue-900 border-2 border-blue-400 rounded-xl p-5 text-lg mb-6">
                {steps[currentStep]}
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                  className={`w-full py-3 text-lg rounded-lg font-semibold flex items-center justify-center gap-2 ${
                    currentStep === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  <FaArrowLeft /> Go Back
                </button>

                <button
                  onClick={handleReset}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-lg font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  <FaRedo /> Start Over
                </button>

                <button
                  onClick={handleNextStep}
                  disabled={currentStep === steps.length - 1}
                  className={`w-full py-3 text-lg rounded-lg font-semibold flex items-center justify-center gap-2 ${
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
                disabled={isTaskDone}
                className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white text-2xl font-extrabold py-5 rounded-full flex items-center justify-center gap-3 shadow-lg focus:ring-4 focus:ring-green-300 transition-all transform hover:scale-105"
              >
                I Did It! <FaCheck size={28} />
              </button>
            </>
          )}

          {/* Task Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevTask}
              disabled={currentTaskIndex === 0}
              className={`px-5 py-2 rounded-lg text-lg font-semibold flex items-center justify-center gap-2 ${
                currentTaskIndex === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              <FaArrowLeft /> Previous Task
            </button>
            <button
              onClick={handleNextTask}
              disabled={currentTaskIndex === filteredTasks.length - 1}
              className={`px-5 py-2 rounded-lg text-lg font-semibold flex items-center justify-center gap-2 ${
                currentTaskIndex === filteredTasks.length - 1
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Next Task <FaArrowRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
