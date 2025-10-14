import React from "react";
import { FiX, FiCheckCircle, FiClock, FiCalendar } from "react-icons/fi";

const StudentTaskView = ({ isOpen, onClose, student, tasks }) => {
  if (!isOpen || !student) return null;

  // Get tasks assigned to this specific student
  const getStudentTaskInfo = (studentId) => {
    const studentTasks = tasks.filter(
      (task) => task.assignedTo?._id === studentId || task.assignedToAll
    );

    const completedTasks = studentTasks.filter((task) => {
      if (task.assignedToAll) {
        return task.completedBy?.some((c) => c.studentId._id === studentId);
      }
      return task.isCompleted;
    });

    const incompleteTasks = studentTasks.filter((task) => {
      if (task.assignedToAll) {
        return !task.completedBy?.some((c) => c.studentId._id === studentId);
      }
      return !task.isCompleted;
    });

    return {
      all: studentTasks,
      completed: completedTasks,
      incomplete: incompleteTasks,
      total: studentTasks.length,
      completedCount: completedTasks.length,
      pending: incompleteTasks.length,
    };
  };

  const taskInfo = getStudentTaskInfo(student._id);
  const completionRate =
    taskInfo.total > 0
      ? Math.round((taskInfo.completedCount / taskInfo.total) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{student.name}</h2>
            <p className="text-indigo-100 text-sm mt-1">Task Overview</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200 hover:rotate-90"
            aria-label="Close modal"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4 text-center transform transition-all hover:scale-105">
              <p className="text-2xl font-bold text-gray-700">
                {taskInfo.total}
              </p>
              <p className="text-sm text-gray-600">Total Tasks</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center transform transition-all hover:scale-105">
              <p className="text-2xl font-bold text-green-600">
                {taskInfo.completedCount}
              </p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center transform transition-all hover:scale-105">
              <p className="text-2xl font-bold text-orange-600">
                {taskInfo.pending}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Overall Progress
              </span>
              <span className="text-sm font-bold text-indigo-700">
                {completionRate}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* Completed Tasks */}
          {taskInfo.completed.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiCheckCircle className="text-green-600" />
                Completed Tasks ({taskInfo.completed.length})
              </h3>
              <div className="space-y-3">
                {taskInfo.completed.map((task) => {
                  const completionInfo = task.assignedToAll
                    ? task.completedBy?.find(
                        (c) => c.studentId._id === student._id
                      )
                    : null;

                  return (
                    <div
                      key={task._id}
                      className="bg-green-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <FiCalendar size={12} />
                            <span>
                              Completed:{" "}
                              {completionInfo
                                ? new Date(
                                    completionInfo.completedAt
                                  ).toLocaleDateString()
                                : task.isCompleted
                                ? new Date(task.updatedAt).toLocaleDateString()
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                        <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap">
                          ✓ Done
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Incomplete Tasks */}
          {taskInfo.incomplete.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiClock className="text-orange-600" />
                Pending Tasks ({taskInfo.incomplete.length})
              </h3>
              <div className="space-y-3">
                {taskInfo.incomplete.map((task) => (
                  <div
                    key={task._id}
                    className="bg-orange-50 border border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <FiCalendar size={12} />
                          <span>
                            Assigned:{" "}
                            {new Date(task.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span className="bg-orange-600 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap">
                        ⏳ Pending
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Tasks Message */}
          {taskInfo.total === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-gray-500 text-lg font-medium">
                No tasks assigned yet
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Tasks will appear here once assigned to this student
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentTaskView;