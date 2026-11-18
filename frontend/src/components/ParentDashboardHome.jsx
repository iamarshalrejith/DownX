
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  getStudents,
  linkStudent,
  reset,
} from "../features/student/studentSlice.js";

import { getAllTasks } from "../features/task/taskSlice.js";
import StudentTaskView from "../modals/StudentTaskView.jsx";
import Loadingdots from "./Loadingdots.jsx";
import { toast } from "react-hot-toast";

import {
  FiUsers,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiUserPlus,
  FiArrowRight,
  FiCheck,
  FiHeart,
  FiLink,
  FiCalendar,
} from "react-icons/fi";

const VISUAL_PINS = ["🌟", "🔥", "💧", "🍀"];

const ParentDashboardHome = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const {
    tasks = [],
    loading: taskLoading,
    error: taskError,
  } = useSelector((state) => state.task || {});

  const {
    myStudents = [],
    isLoading,
    isLinking,
    isError,
    message,
  } = useSelector((state) => state.students);

  const [children, setChildren] = useState([]);
  const [enrollmentId, setEnrollmentId] = useState("");
  const [visualPin, setVisualPin] = useState(["", "", "", ""]);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ERROR HANDLING
  useEffect(() => {
    if (isError && message) {
      toast.error(message);
      dispatch(reset());
    }

    if (taskError) toast.error(taskError);
  }, [isError, message, dispatch, taskError]);

  // FETCH STUDENTS AND TASKS
  useEffect(() => {
    if (user?.token) {
      dispatch(getStudents());
      dispatch(getAllTasks(user.token));
    }
  }, [dispatch, user?.token]);

  // CHILD TASK INFORMATION
  const getChildTaskInfo = (childId) => {
    const childTasks = tasks.filter(
      (task) =>
        task.assignedToAll ||
        task.assignedTo?._id === childId
    );

    const completedTasks = childTasks.filter((task) => {
      if (task.assignedToAll) {
        return task.completedBy?.some(
          (completion) => completion.studentId?._id === childId
        );
      }

      return task.isCompleted;
    });

    return {
      tasks: childTasks,
      total: childTasks.length,
      completed: completedTasks.length,
      pending: childTasks.length - completedTasks.length,
    };
  };

  // LINKED CHILDREN
  useEffect(() => {
    if (user?.studentIds && myStudents.length > 0) {
      const linkedChildren = myStudents.filter((student) =>
        user.studentIds.includes(student._id)
      );

      const childrenWithTasks = linkedChildren.map((child) => ({
        ...child,
        ...getChildTaskInfo(child._id),
      }));

      setChildren(childrenWithTasks);
    } else {
      setChildren([]);
    }
  }, [user, myStudents, tasks]);

  // OVERALL STATISTICS
  const stats = children.reduce(
    (result, child) => ({
      totalTasks: result.totalTasks + child.total,
      completed: result.completed + child.completed,
      pending: result.pending + child.pending,
    }),
    { totalTasks: 0, completed: 0, pending: 0 }
  );

  // VISUAL PIN HANDLING
  const handlePinTap = (index) => {
    setVisualPin((previous) => {
      const current = previous[index];

      const nextIndex = current
        ? (VISUAL_PINS.indexOf(current) + 1) % VISUAL_PINS.length
        : 0;

      const updated = [...previous];
      updated[index] = VISUAL_PINS[nextIndex];

      return updated;
    });
  };

  // LINK CHILD
  const handleLinkChild = async (event) => {
    event.preventDefault();

    if (!enrollmentId.trim()) {
      toast.error("Please enter an enrollment ID.");
      return;
    }

    if (visualPin.includes("")) {
      toast.error("Please complete all 4 parts of the visual PIN.");
      return;
    }

    try {
      await dispatch(
        linkStudent({ enrollmentId, visualPin })
      ).unwrap();

      toast.success("Child linked successfully!");

      setEnrollmentId("");
      setVisualPin(["", "", "", ""]);

      // Refresh linked students
      if (user?.token) {
        dispatch(getStudents());
      }
    } catch (err) {
      toast.error(err?.message || "Failed to link child");
    }
  };

  // STUDENT MODAL
  const handleChildClick = (child) => {
    setSelectedStudent(child);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedStudent(null), 300);
  };

  const statCards = [
    {
      label: "Total Children",
      value: children.length,
      description: "Linked to your account",
      icon: FiUsers,
      color: "brand",
    },
    {
      label: "Total Tasks",
      value: stats.totalTasks,
      description: "Assigned learning activities",
      icon: FiBookOpen,
      color: "accent",
    },
    {
      label: "Completed",
      value: stats.completed,
      description: "Successfully completed",
      icon: FiCheckCircle,
      color: "success",
    },
    {
      label: "Pending",
      value: stats.pending,
      description: "Still to be completed",
      icon: FiClock,
      color: "warning",
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
    warning: {
      icon: "bg-[#F8EEDA] text-[#C9932F]",
      value: "text-[#A47720]",
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

      {/* WELCOME */}
      <section className="space-y-2">
        <p className="text-sm font-bold uppercase tracking-wide text-[#2F6B66]">
          YOUR FAMILY'S LEARNING JOURNEY
        </p>

        <h2 className="text-2xl font-bold tracking-tight text-[#1F4B47] sm:text-3xl">
          Welcome back, {user?.name || "Parent"}!
        </h2>

        <p className="text-sm text-[#6B6863] sm:text-base">
          Stay connected with your child's learning and celebrate every achievement.
        </p>
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

                  <h3 className={`mt-3 text-3xl font-bold ${colors.value}`}>
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

      {/* CHILD ACTIVITY */}
      <section className="overflow-hidden rounded-2xl border border-[#E6E2D8] bg-white shadow-sm">

        <div className="border-b border-[#E6E2D8] px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E4EFEE] text-[#2F6B66]">
              <FiHeart size={21} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#1F4B47]">
                Your Child's Activity
              </h3>

              <p className="mt-1 text-sm text-[#6B6863]">
                Follow progress and celebrate achievements.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-7">

          {children.length > 0 ? (
            children.map((child) => {
              const completionRate =
                child.total > 0
                  ? Math.round((child.completed / child.total) * 100)
                  : 0;

              const initials = child.name
                ?.split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={child._id}
                  onClick={() => handleChildClick(child)}
                  className="cursor-pointer rounded-xl border border-[#E6E2D8] p-5 transition hover:border-[#B9D4CD] hover:bg-[#FAFCFB]"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#E4EFEE] text-lg font-bold text-[#2F6B66]">
                        {initials || "C"}
                      </div>

                      <div>
                        <h4 className="text-lg font-bold text-[#262521]">
                          {child.name}
                        </h4>

                        {child.total > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                            <span className="text-[#6B6863]">
                              {child.total} tasks
                            </span>

                            <span className="flex items-center gap-1 font-medium text-[#4C8C5B]">
                              <FiCheck size={14} />
                              {child.completed} completed
                            </span>

                            {child.pending > 0 && (
                              <span className="flex items-center gap-1 text-[#B85C34]">
                                <FiClock size={14} />
                                {child.pending} pending
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-[#96928B]">
                            No tasks assigned yet.
                          </p>
                        )}
                      </div>
                    </div>

                    {child.total > 0 && (
                      <div className="sm:w-44">
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="font-medium text-[#6B6863]">
                            Progress
                          </span>

                          <span className="font-bold text-[#2F6B66]">
                            {completionRate}%
                          </span>
                        </div>

                        <div className="h-2.5 overflow-hidden rounded-full bg-[#EAE8E2]">
                          <div
                            className="h-full rounded-full bg-[#2F6B66] transition-all duration-500"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl bg-[#F0F5F2] px-5 py-12 text-center">
              <FiUsers
                size={32}
                className="mx-auto mb-3 text-[#2F6B66]"
              />

              <h4 className="font-bold text-[#1F4B47]">
                No children linked yet
              </h4>

              <p className="mt-2 text-sm text-[#6B6863]">
                Link your child's account below to follow their learning journey.
              </p>
            </div>
          )}

        </div>
      </section>

      {/* LINK CHILD */}
      <section className="overflow-hidden rounded-2xl border border-[#D7E7E1] bg-white shadow-sm">

        <div className="bg-[#1F4B47] px-6 py-6 text-white sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <FiUserPlus size={23} />
            </div>

            <div>
              <h3 className="text-xl font-bold">
                Link Your Child
              </h3>

              <p className="mt-1 text-sm text-white/70">
                Connect your account to your child's DownX profile.
              </p>
            </div>
          </div>
        </div>

        <form
          className="space-y-7 p-6 sm:p-8"
          onSubmit={handleLinkChild}
        >

          {/* ENROLLMENT ID */}
          <div>
            <label
              htmlFor="enrollmentId"
              className="mb-2 block text-sm font-bold text-[#262521]"
            >
              Student Enrollment ID
            </label>

            <input
              id="enrollmentId"
              type="text"
              value={enrollmentId}
              onChange={(event) => setEnrollmentId(event.target.value)}
              placeholder="Enter your child's enrollment ID"
              className="w-full rounded-xl border border-[#DCD9D1] bg-[#FAFAF8] px-4 py-3 text-sm text-[#262521] outline-none transition placeholder:text-[#AAA69E] focus:border-[#2F6B66] focus:bg-white focus:ring-2 focus:ring-[#2F6B66]/15"
              required
            />
          </div>

          {/* VISUAL PIN */}
          <div>
            <label className="mb-2 block text-sm font-bold text-[#262521]">
              Visual PIN
            </label>

            <p className="mb-4 text-sm text-[#6B6863]">
              Tap each box to select the matching symbol from your child's PIN.
            </p>

            <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
              {visualPin.map((value, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Visual PIN position ${index + 1}: ${value || "not selected"}`}
                  onClick={() => handlePinTap(index)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D7E7E1] bg-[#E4EFEE] text-3xl shadow-sm transition hover:-translate-y-1 hover:border-[#2F6B66] hover:bg-[#D7E9E3] focus:outline-none focus:ring-2 focus:ring-[#2F6B66]"
                >
                  {value || "❔"}
                </button>
              ))}
            </div>

            <p className="mt-3 text-xs text-[#96928B]">
              Select all four symbols in the correct order.
            </p>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={isLinking}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2F6B66] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#1F4B47] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <FiLink size={17} />
            {isLinking ? "Linking..." : "Link Child"}
            {!isLinking && <FiArrowRight size={17} />}
          </button>

        </form>
      </section>

      {/* STUDENT TASK MODAL */}
      <StudentTaskView
        isOpen={isModalOpen}
        onClose={closeModal}
        student={selectedStudent}
        tasks={tasks}
      />

    </div>
  );
};

export default ParentDashboardHome;
