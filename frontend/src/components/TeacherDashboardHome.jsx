
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getStudents, reset } from "../features/student/studentSlice.js";
import { getAllTasks } from "../features/task/taskSlice.js";
import { Link } from "react-router-dom";
import Loadingdots from "./Loadingdots.jsx";
import StudentTaskView from "../modals/StudentTaskView.jsx";
import { toast } from "react-hot-toast";

import {
  FiUsers,
  FiBookOpen,
  FiCheckCircle,
  FiTrendingUp,
  FiPlus,
  FiArrowRight,
  FiClock,
  FiCalendar,
  FiCamera,
  FiClipboard,
  FiCheck,
} from "react-icons/fi";

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

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user?.token) {
      dispatch(getStudents());
      dispatch(getAllTasks(user.token));
    }
  }, [dispatch, user?.token]);

  useEffect(() => {
    if (taskError) toast.error(taskError);
  }, [taskError]);

  useEffect(() => {
    if (isError && message) {
      toast.error(message);
      dispatch(reset());
    }
  }, [isError, message, dispatch]);

  // TASK STATISTICS
  const getTaskStats = () => {
    const totalTasks = tasks.length;

    const assignedToAllTasks = tasks.filter(
      (task) => task.assignedToAll
    ).length;

    const specificStudentTasks = tasks.filter(
      (task) => task.assignedTo && !task.assignedToAll
    ).length;

    const totalCompletions = tasks.reduce((sum, task) => {
      if (task.assignedToAll) {
        return sum + (task.completedBy?.length || 0);
      }

      if (task.isCompleted) return sum + 1;

      return sum;
    }, 0);

    return {
      totalTasks,
      assignedToAllTasks,
      specificStudentTasks,
      totalCompletions,
    };
  };

  // STUDENT TASK INFORMATION
  const getStudentTaskInfo = (studentId) => {
    const studentTasks = tasks.filter(
      (task) =>
        task.assignedTo?._id === studentId ||
        task.assignedToAll
    );

    const completedTasks = studentTasks.filter((task) => {
      if (task.assignedToAll) {
        return task.completedBy?.some(
          (completion) => completion.studentId?._id === studentId
        );
      }

      return task.isCompleted;
    });

    return {
      total: studentTasks.length,
      completed: completedTasks.length,
      pending: studentTasks.length - completedTasks.length,
    };
  };

  // FACE ENROLLMENT
  const handleEnableFaceEnrollment = async (studentId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/students/${studentId}/face-enroll-session`,
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

      await navigator.clipboard.writeText(enrollLink);

      toast.success("Face enrollment link copied to clipboard!");
    } catch (err) {
      toast.error(
        err.message || "Failed to generate face enrollment link"
      );
    }
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedStudent(null), 300);
  };

  const stats = getTaskStats();

  const averageCompletion =
    stats.totalTasks > 0
      ? Math.round(
          (stats.totalCompletions /
            (stats.totalTasks * Math.max(myStudents.length, 1))) *
            100
        )
      : 0;

  const statCards = [
    {
      label: "Total Students",
      value: myStudents.length,
      icon: FiUsers,
      color: "brand",
      description: "Students in your classroom",
    },
    {
      label: "Total Tasks",
      value: stats.totalTasks,
      icon: FiBookOpen,
      color: "accent",
      description: `All: ${stats.assignedToAllTasks} · Individual: ${stats.specificStudentTasks}`,
    },
    {
      label: "Total Completions",
      value: stats.totalCompletions,
      icon: FiCheckCircle,
      color: "success",
      description: "Completed task instances",
    },
    {
      label: "Avg. Completion",
      value: `${averageCompletion}%`,
      icon: FiTrendingUp,
      color: "purple",
      description: "Across assigned tasks",
    },
  ];

  const statColors = {
    brand: {
      icon: "bg-[#E4EFEE] text-[#2F6B66]",
      value: "text-[#1F4B47]",
    },
    accent: {
      icon: "bg-[#FBEAE1] text-[#D97748]",
      value: "text-[#B85C34]",
    },
    success: {
      icon: "bg-[#E7F2E9] text-[#4C8C5B]",
      value: "text-[#4C8C5B]",
    },
    purple: {
      icon: "bg-[#F0EDF9] text-[#71639B]",
      value: "text-[#71639B]",
    },
  };

  if (isLoading || taskLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loadingdots />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* WELCOME AND ACTION */}
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-sm font-semibold text-[#2F6B66]">
            YOUR CLASSROOM OVERVIEW
          </p>

          <h2 className="text-2xl font-bold tracking-tight text-[#1F4B47] sm:text-3xl">
            Good morning, {user?.name || "Teacher"}!
          </h2>

          <p className="mt-2 text-sm text-[#6B6863] sm:text-base">
            Here's an overview of your students and their learning progress.
          </p>
        </div>

        <Link
          to="/dashboard/tasks/create"
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2F6B66] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1F4B47] hover:shadow-md"
        >
          <FiPlus size={19} />
          Create New Task
        </Link>
      </section>

      {/* STATISTICS */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const colors = statColors[stat.color];

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-[#E6E2D8] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-[#6B6863]">
                    {stat.label}
                  </p>

                  <h3
                    className={`mt-3 text-3xl font-bold tracking-tight ${colors.value}`}
                  >
                    {stat.value}
                  </h3>
                </div>

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.icon}`}
                >
                  <Icon size={23} />
                </div>
              </div>

              <p className="mt-4 text-xs text-[#96928B]">
                {stat.description}
              </p>
            </div>
          );
        })}
      </section>

      {/* STUDENTS */}
      <section className="overflow-hidden rounded-2xl border border-[#E6E2D8] bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-3 border-b border-[#E6E2D8] px-5 py-5 sm:flex-row sm:items-center sm:px-7">
          <div>
            <h3 className="text-xl font-bold text-[#1F4B47]">
              Your Students
            </h3>

            <p className="mt-1 text-sm text-[#6B6863]">
              Monitor individual learning progress.
            </p>
          </div>

          <Link
            to="/dashboard/all-students"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#2F6B66] transition hover:text-[#1F4B47]"
          >
            View All Students
            <FiArrowRight size={16} />
          </Link>
        </div>

        <div className="space-y-3 p-5 sm:p-7">

          {myStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl bg-[#F0F5F2] px-5 py-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E4EFEE] text-[#2F6B66]">
                <FiUsers size={26} />
              </div>

              <h4 className="font-bold text-[#1F4B47]">
                No students assigned yet
              </h4>

              <p className="mt-2 text-sm text-[#6B6863]">
                Your students will appear here once they are assigned.
              </p>

              <Link
                to="/dashboard/students"
                className="mt-5 rounded-xl bg-[#2F6B66] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1F4B47]"
              >
                Manage Students
              </Link>
            </div>
          ) : (
            myStudents.map((student) => {
              const taskInfo = getStudentTaskInfo(student._id);

              const completionRate =
                taskInfo.total > 0
                  ? Math.round(
                      (taskInfo.completed / taskInfo.total) * 100
                    )
                  : 0;

              const initials = student.name
                ?.split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={student._id}
                  onClick={() => handleStudentClick(student)}
                  className="group cursor-pointer rounded-xl border border-[#E6E2D8] p-4 transition hover:border-[#B9D4CD] hover:bg-[#FAFCFB] sm:p-5"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                    {/* STUDENT DETAILS */}
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E4EFEE] text-base font-bold text-[#2F6B66]">
                        {initials || "S"}
                      </div>

                      <div className="min-w-0">
                        <h4 className="truncate text-base font-bold text-[#262521]">
                          {student.name}
                        </h4>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm">
                          <span className="text-[#6B6863]">
                            {taskInfo.total} task
                            {taskInfo.total !== 1 ? "s" : ""}
                          </span>

                          <span className="inline-flex items-center gap-1 font-medium text-[#4C8C5B]">
                            <FiCheck size={14} />
                            {taskInfo.completed} completed
                          </span>

                          {taskInfo.pending > 0 && (
                            <span className="inline-flex items-center gap-1 text-[#B85C34]">
                              <FiClock size={14} />
                              {taskInfo.pending} pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* STUDENT ACTIONS AND PROGRESS */}
                    <div className="flex flex-col gap-3 sm:items-end">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleEnableFaceEnrollment(student._id);
                        }}
                        className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-[#B9D4CD] bg-[#E4EFEE] px-3 py-2 text-xs font-bold text-[#1F4B47] transition hover:bg-[#D5E8E2] sm:self-auto"
                      >
                        <FiCamera size={14} />
                        Enable Face Login
                      </button>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[#2F6B66]">
                          {completionRate}%
                        </span>

                        <div className="h-2 w-28 overflow-hidden rounded-full bg-[#EAE8E2]">
                          <div
                            className="h-full rounded-full bg-[#2F6B66] transition-all duration-500"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          )}

        </div>
      </section>

      {/* RECENT TASKS */}
      {tasks.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-[#E6E2D8] bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-[#E6E2D8] px-5 py-5 sm:px-7">
            <div>
              <h3 className="text-xl font-bold text-[#1F4B47]">
                Recent Tasks
              </h3>

              <p className="mt-1 text-sm text-[#6B6863]">
                Keep track of assigned learning activities.
              </p>
            </div>

            <Link
              to="/dashboard/tasks"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#2F6B66] transition hover:text-[#1F4B47]"
            >
              View All
              <FiArrowRight size={16} />
            </Link>
          </div>

          <div className="divide-y divide-[#F0EEE8] px-5 sm:px-7">
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task._id}
                className="flex flex-col justify-between gap-3 py-5 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FBEAE1] text-[#D97748]">
                    <FiClipboard size={19} />
                  </div>

                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-bold text-[#262521]">
                      {task.title}
                    </h4>

                    <p className="mt-1 text-xs text-[#6B6863]">
                      {task.assignedToAll
                        ? `All Students · ${task.completedBy?.length || 0}/${myStudents.length} completed`
                        : `${task.assignedTo?.name || "Unknown"} · ${
                            task.isCompleted ? "Completed" : "Pending"
                          }`}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 text-xs text-[#96928B]">
                  <FiCalendar size={14} />

                  {task.createdAt
                    ? new Date(task.createdAt).toLocaleDateString()
                    : "Date unavailable"}
                </div>
              </div>
            ))}
          </div>

        </section>
      )}

      {/* STUDENT TASK DETAILS MODAL */}
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
