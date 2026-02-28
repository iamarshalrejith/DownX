import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getStudents, reset } from "../features/student/studentSlice.js";
import { getAllTasks } from "../features/task/taskSlice.js";
import { Link } from "react-router-dom";
import Loadingdots from "./Loadingdots.jsx";
import StudentTaskView from "../modals/StudentTaskView.jsx";
import { toast } from "react-hot-toast";

const TeacherDashboardHome = () => {
  const dispatch = useDispatch();

  const {
    myStudents = [],
    isLoading,
    isError,
    message,
  } = useSelector((state) => state.students);

  const {
    tasks = [],
    loading: taskLoading,
    error: taskError,
  } = useSelector((state) => state.task || {});
  const { user } = useSelector((state) => state.auth);

  // Modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch students when teacher is logged in
  useEffect(() => {
    if (user?.token) {
      dispatch(getStudents());
      dispatch(getAllTasks(user.token));
    }
  }, [dispatch, user?.token]);

  // Handle task fetch errors
  useEffect(() => {
    if (taskError) toast.error(taskError);
  }, [taskError]);

  // Show toast on error and reset state
  useEffect(() => {
    if (isError && message) {
      toast.error(message);
      dispatch(reset());
    }
  }, [isError, message, dispatch]);

  // Calculate task statistics
  const getTaskStats = () => {
    const totalTasks = tasks.length;
    const assignedToAllTasks = tasks.filter((t) => t.assignedToAll).length;
    const specificStudentTasks = tasks.filter(
      (t) => t.assignedTo && !t.assignedToAll
    ).length;

    const totalCompletions = tasks.reduce((sum, task) => {
      if (task.assignedToAll) {
        return sum + (task.completedBy?.length || 0);
      } else if (task.isCompleted) {
        return sum + 1;
      }
      return sum;
    }, 0);

    return {
      totalTasks,
      assignedToAllTasks,
      specificStudentTasks,
      totalCompletions,
    };
  };

  // Get tasks assigned to a specific student
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

    return {
      total: studentTasks.length,
      completed: completedTasks.length,
      pending: studentTasks.length - completedTasks.length,
    };
  };

  // Helper function to enable face enrollment
  const handleEnableFaceEnrollment = async (studentId) => {
    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/students/${studentId}/face-enroll-session`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      const enrollLink = `${window.location.origin}/face-enroll?token=${data.enrollmentToken}`;

      navigator.clipboard.writeText(enrollLink);

      toast.success("Face enrollment link copied!");
    } catch (err) {
      toast.error(err.message || "Failed to enable face enrollment");
    }
  };

  // Handle student click - open modal
  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedStudent(null), 300); // Delay to allow animation
  };

  const stats = getTaskStats();

  // Show loader while fetching data
  if (isLoading || taskLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loadingdots />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 p-8">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-4xl font-extrabold text-indigo-700 tracking-tight">
              Teacher Dashboard
            </h1>
          </div>

          <Link
            to="/dashboard/tasks/create"
            className="mt-4 sm:mt-0 inline-block bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300"
          >
            Create New Task
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-indigo-100 shadow-lg hover:shadow-xl transition">
            <h2 className="text-gray-600 font-medium mb-2">Total Students</h2>
            <p className="text-4xl font-bold text-indigo-700">
              {myStudents.length}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-indigo-100 shadow-lg hover:shadow-xl transition">
            <h2 className="text-gray-600 font-medium mb-2">Total Tasks</h2>
            <p className="text-4xl font-bold text-indigo-700">
              {stats.totalTasks}
            </p>
            <div className="mt-2 text-sm text-gray-600">
              <div>All Students: {stats.assignedToAllTasks}</div>
              <div>Individual: {stats.specificStudentTasks}</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-green-100 shadow-lg hover:shadow-xl transition">
            <h2 className="text-gray-600 font-medium mb-2">
              Total Completions
            </h2>
            <p className="text-4xl font-bold text-green-600">
              {stats.totalCompletions}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-purple-100 shadow-lg hover:shadow-xl transition">
            <h2 className="text-gray-600 font-medium mb-2">Avg Completion</h2>
            <p className="text-4xl font-bold text-purple-600">
              {stats.totalTasks > 0
                ? `${Math.round(
                    (stats.totalCompletions /
                      (stats.totalTasks * Math.max(myStudents.length, 1))) *
                      100
                  )}%`
                : "0%"}
            </p>
          </div>
        </div>

        {/* Students List with Task Details */}
        <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-md border border-indigo-100 shadow-md">
          <h2 className="text-2xl font-semibold text-indigo-700 mb-4">
            Your Students
          </h2>

          {myStudents.length > 0 ? (
            <ul className="space-y-3">
              {myStudents.map((student) => {
                const taskInfo = getStudentTaskInfo(student._id);
                const completionRate =
                  taskInfo.total > 0
                    ? Math.round((taskInfo.completed / taskInfo.total) * 100)
                    : 0;

                return (
                  <li
                    key={student._id}
                    onClick={() => handleStudentClick(student)}
                    className="border border-gray-200 rounded-xl p-4 hover:bg-indigo-50/60 transition cursor-pointer"
                  >
                    <div className="flex justify-between items-center">
                      {/* Left side: student info */}
                      <div className="flex-1">
                        <span className="font-medium text-gray-800 text-lg block">
                          {student.name}
                        </span>

                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-gray-600">
                            {taskInfo.total} task
                            {taskInfo.total !== 1 ? "s" : ""}
                          </span>
                          <span className="text-green-600 font-medium">
                            ✓ {taskInfo.completed} completed
                          </span>
                          {taskInfo.pending > 0 && (
                            <span className="text-orange-600">
                              ⏳ {taskInfo.pending} pending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right side: button + progress */}
                      <div className="ml-4 flex flex-col items-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEnableFaceEnrollment(student._id);
                          }}
                          className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition"
                        >
                          Enable Face Login
                        </button>

                        {taskInfo.total > 0 && (
                          <>
                            <span className="text-sm font-semibold text-indigo-700">
                              {completionRate}%
                            </span>
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
                                style={{ width: `${completionRate}%` }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No students assigned yet.
            </p>
          )}
        </div>

        {/* Recent Tasks Overview */}
        {tasks.length > 0 && (
          <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-md border border-indigo-100 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-indigo-700">
                📋 Recent Tasks
              </h2>
              <Link
                to="/dashboard/tasks"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <div
                  key={task._id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {task.assignedToAll
                          ? `All Students (${task.completedBy?.length || 0}/${
                              myStudents.length
                            } completed)`
                          : `${task.assignedTo?.name || "Unknown"} ${
                              task.isCompleted ? "✓ Completed" : "⏳ Pending"
                            }`}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Student Task Modal */}
      <StudentTaskView
        isOpen={isModalOpen}
        onClose={closeModal}
        student={selectedStudent}
        tasks={tasks}
      />
    </div>
  );
};

export default TeacherDashboardHome;
