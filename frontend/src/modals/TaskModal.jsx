import React from "react";

const TaskModal = ({ task, onClose }) => {
  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center bg-indigo-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white">{task.title}</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold"
          >
            ✖
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Status Badge */}
          <p className="mb-4">
            Status:{" "}
            <span
              className={`font-semibold ${
                task.isCompleted ? "text-green-600" : "text-red-500"
              }`}
            >
              {task.isCompleted ? "Completed" : "Pending"}
            </span>
          </p>

          {/* Description */}
          <p className="text-gray-700 mb-4">{task.description || "No description provided."}</p>

          {/* Steps */}
          {task.simplifiedSteps && task.simplifiedSteps.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">Steps:</h3>
              <ul className="list-decimal list-inside text-gray-700 space-y-1">
                {task.simplifiedSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Optional: Buttons */}
          <div className="flex justify-end mt-6 space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
