
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiStar,
  FiArrowRight,
  FiLogOut,
  FiMessageCircle,
  FiPlay,
  FiAward,
} from "react-icons/fi";

import { getAllTasks } from "../features/task/taskSlice";
import { logout } from "../features/auth/authSlice";
import { reset as resetStudent } from "../features/student/studentSlice";

const StudentHome = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);

  const {
    tasks = [],
    loading,
    error,
  } = useSelector((state) => state.task);

  const token = localStorage.getItem("studentToken") || user?.token;

  useEffect(() => {
    if (token) {
      dispatch(getAllTasks(token));
    } else {
      navigate("/student-login", { replace: true });
    }
  }, [dispatch, token, navigate]);

  const activeTasks = useMemo(
    () => tasks.filter((task) => !task.isCompletedByMe),
    [tasks]
  );

  const completedTasks = tasks.length - activeTasks.length;

  const progress = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  const handleLogout = () => {
    localStorage.removeItem("studentToken");
    dispatch(logout());
    dispatch(resetStudent());
    navigate("/", { replace: true });
  };

  const firstName = user?.name?.split(" ")[0] || "Friend";

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-light border-t-brand" />
          <p className="font-bold text-brand">Getting your activities ready...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <FiClock size={42} className="text-warn" />
        <h2 className="text-2xl font-bold text-ink">We couldn't load your activities.</h2>
        <button
          onClick={() => token && dispatch(getAllTasks(token))}
          className="rounded-xl bg-brand px-6 py-3 font-bold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg px-4 py-5 sm:px-8 lg:px-12">

      {/* HEADER */}
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-xl font-extrabold text-white">
            D
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-brand-dark">DownX</h1>
            <p className="text-xs text-ink-soft">Learn. Grow. Shine.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold text-ink">{user?.name || "Student"}</p>
            <p className="text-xs text-ink-soft">Your learning space</p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-light font-bold text-brand">
            {firstName[0]?.toUpperCase()}
          </div>

          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-danger transition hover:bg-danger-light"
          >
            <FiLogOut size={19} />
          </button>
        </div>
      </header>

      <main className="mx-auto mt-9 max-w-7xl space-y-8">

        {/* WELCOME */}
        <section>
          <p className="text-sm font-extrabold uppercase tracking-wider text-brand">
            YOUR LEARNING SPACE
          </p>

          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-dark sm:text-4xl">
            Hello, {firstName}! 👋
          </h2>

          <p className="mt-3 max-w-2xl text-base text-ink-soft">
            Every little step is a big achievement. Let's learn something today!
          </p>
        </section>

        {/* PROGRESS OVERVIEW */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink-soft">My Activities</p>
              <div className="rounded-xl bg-brand-light p-3 text-brand">
                <FiBookOpen size={22} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-brand-dark">
              {tasks.length}
            </p>
            <p className="mt-1 text-sm text-ink-soft">Assigned activities</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink-soft">Completed</p>
              <div className="rounded-xl bg-success-light p-3 text-success">
                <FiCheckCircle size={22} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-success">
              {completedTasks}
            </p>
            <p className="mt-1 text-sm text-ink-soft">Activities completed</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink-soft">Still to Do</p>
              <div className="rounded-xl bg-accent-light p-3 text-accent-dark">
                <FiClock size={22} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-accent-dark">
              {activeTasks.length}
            </p>
            <p className="mt-1 text-sm text-ink-soft">Activities waiting for you</p>
          </div>

        </section>

        {/* LEARNING PROGRESS */}
        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FiStar className="text-warn" size={21} />
                <h3 className="text-xl font-extrabold text-brand-dark">
                  My Learning Progress
                </h3>
              </div>
              <p className="mt-2 text-sm text-ink-soft">
                Look how far you've come!
              </p>
            </div>

            <p className="text-3xl font-extrabold text-brand">
              {progress}%
            </p>
          </div>

          <div className="mt-5 h-4 overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full bg-brand transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="mt-3 text-sm text-ink-soft">
            You've completed {completedTasks} out of {tasks.length} activities.
          </p>
        </section>

        {/* CONTINUE LEARNING */}
        <section className="overflow-hidden rounded-3xl bg-brand-dark p-6 text-white shadow-md sm:p-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
                <FiStar size={14} />
                LET'S LEARN
              </span>

              <h3 className="mt-4 text-2xl font-extrabold sm:text-3xl">
                Ready for your next activity?
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">
                Follow the pictures, listen to the instructions and complete each step at your own pace.
              </p>

              <button
                onClick={() => navigate("/student-dashboard/learn")}
                disabled={activeTasks.length === 0}
                className="mt-6 inline-flex items-center gap-3 rounded-xl bg-white px-6 py-4 font-extrabold text-brand-dark transition hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiPlay size={19} />
                {activeTasks.length > 0 ? "Continue Learning" : "No Activities Yet"}
                <FiArrowRight size={18} />
              </button>
            </div>

            <div className="flex h-32 w-32 shrink-0 items-center justify-center self-center rounded-full bg-white/10 text-6xl md:h-40 md:w-40">
              🌱
            </div>
          </div>
        </section>

        {/* MY ACTIVITIES */}
        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-5 sm:px-7">
            <div>
              <h3 className="text-xl font-extrabold text-brand-dark">
                My Activities
              </h3>
              <p className="mt-1 text-sm text-ink-soft">
                Here are your learning activities.
              </p>
            </div>
            <FiBookOpen size={23} className="text-brand" />
          </div>

          <div className="space-y-3 p-5 sm:p-7">
            {tasks.length > 0 ? (
              tasks.map((task) => {
                const completed = task.isCompletedByMe;

                return (
                  <div
                    key={task._id}
                    className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          completed
                            ? "bg-success-light text-success"
                            : "bg-accent-light text-accent-dark"
                        }`}
                      >
                        {completed ? (
                          <FiCheckCircle size={21} />
                        ) : (
                          <FiBookOpen size={21} />
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-ink">
                          {task.title || "Learning Activity"}
                        </h4>
                        <p className="mt-1 text-sm text-ink-soft">
                          {completed ? "Completed — great job!" : "Ready when you are"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`self-start rounded-full px-3 py-1 text-xs font-bold sm:self-center ${
                        completed
                          ? "bg-success-light text-success"
                          : "bg-warn-light text-[#A47720]"
                      }`}
                    >
                      {completed ? "Completed" : "Pending"}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center">
                <FiBookOpen size={35} className="mx-auto text-brand" />
                <h4 className="mt-3 font-bold text-brand-dark">
                  No activities yet
                </h4>
                <p className="mt-2 text-sm text-ink-soft">
                  Your teacher will add some activities for you soon.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* AI BUDDY */}
        <section className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-[#E8DFF4] bg-[#F4F0FA] p-6 sm:flex-row sm:items-center sm:p-7">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
              🤖
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#594477]">
                Meet AI Buddy
              </h3>
              <p className="mt-1 text-sm text-[#76668D]">
                Have a friendly conversation and learn something new.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/ai-mode")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#70549B] px-5 py-3 font-bold text-white transition hover:bg-[#594477]"
          >
            <FiMessageCircle size={18} />
            Talk to Buddy
            <FiArrowRight size={17} />
          </button>
        </section>

        {/* FOOTER */}
        <footer className="pb-4 pt-2 text-center text-sm text-ink-soft">
          <div className="flex items-center justify-center gap-2">
            <FiAward className="text-warn" />
            <span>Keep learning. Keep growing. You're doing great!</span>
          </div>
          <p className="mt-2 text-xs">DownX · Learn. Grow. Shine.</p>
        </footer>

      </main>
    </div>
  );
};

export default StudentHome;
