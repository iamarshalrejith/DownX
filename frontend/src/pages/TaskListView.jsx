import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllTasks } from "../features/task/taskSlice.js";
import { getStudents } from "../features/student/studentSlice.js"; 
import Loadingdots from "../components/Loadingdots.jsx";
import toast from "react-hot-toast";
import TaskModal from "../modals/TaskModal.jsx";
import { Link } from "react-router-dom";

const TaskListView = () => {
  const dispatch = useDispatch();
  const { tasks = [], loading, error } = useSelector((state) => state.task);
  const { myStudents = [] } = useSelector((state) => state.students); 
  const { user } = useSelector((state) => state.auth);

  // Modal state
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Multi-fetch tasks + students
  useEffect(() => {
    if (user?.token) {
      dispatch(getAllTasks(user.token));
      dispatch(getStudents(user.token));
    }
  }, [dispatch, user?.token]);

  // Show toast on error
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // Helper: Find student name
  const getStudentName = (task) => {
    if (task.assignedToAll) return "All Students";
    const student = myStudents.find((s) => s._id === task.assignedTo?._id);
    return student ? student.name : "All Students";
  };

  // Modal handlers
  const openModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedTask(null);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
          All Tasks
        </h1>
        {user?.role === "teacher" && (
          <Link
            to="/dashboard/tasks/create"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Create Task
          </Link>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-16">
          <Loadingdots />
        </div>
      )}

      {/* Tasks List or Empty State */}
      {!loading && (
        <>
          {tasks && tasks.length > 0 ? (
            <ul className="space-y-4">
              {tasks.map((task) => (
                <li
                  key={task._id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex justify-between items-center hover:shadow-lg transition"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-1">
                      {task.title}
                    </h2>
                    <p className="text-sm text-indigo-600 mb-1">
                      Assigned to: <span className="font-medium">{getStudentName(task)}</span>
                    </p>
                    <p className="text-gray-500 text-sm">
                      {task.description
                        ? task.description.slice(0, 150) +
                          (task.description.length > 150 ? "…" : "")
                        : "No description provided."}
                    </p>
                  </div>

                  {/* Open modal button */}
                  <button
                    onClick={() => openModal(task)}
                    className="text-indigo-600 font-medium hover:underline ml-4"
                  >
                    View
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center mt-16 text-lg">
              No tasks found. Try creating one!
            </p>
          )}
        </>
      )}

      {/* Task Modal */}
      {isModalOpen && <TaskModal task={selectedTask} onClose={closeModal} />}
    </div>
  );
};

export default TaskListView;
