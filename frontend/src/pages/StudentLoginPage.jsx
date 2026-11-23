
import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { studentLogin, reset } from "../features/student/studentSlice";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiHelpCircle,
  FiUser,
  FiCamera,
  FiImage,
  FiArrowRight,
  FiCheckCircle,
} from "react-icons/fi";
import Confetti from "react-confetti";
import toast from "react-hot-toast";
import LoadingDots from "../components/Loadingdots";
import axios from "axios";
import {
  VISUAL_PIN_VALUES,
  VISUAL_PIN_DISPLAY,
} from "../utils/visualPinDisplay";

const StudentLoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const navigatedRef = useRef(false);
  const resetCalledRef = useRef(false);
  const latestEnrollRef = useRef("");

  const [enrollmentId, setEnrollmentId] = useState("");
  const [visualPin, setVisualPin] = useState(["", "", "", ""]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [faceEnabled, setFaceEnabled] = useState(null);
  const [loginMode, setLoginMode] = useState(null);
  const [checkingStudent, setCheckingStudent] = useState(false);

  const { student, isLoading, loginSuccess, isError, message } =
    useSelector((state) => state.students);

  // Login success
  useEffect(() => {
    if (loginSuccess && student && !navigatedRef.current) {
      navigatedRef.current = true;
      toast.success("Welcome back!");
      setShowConfetti(true);
      navigate("/student-dashboard", { replace: true });

      const timer = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [loginSuccess, student, navigate]);

  // Login error
  useEffect(() => {
    if (isError && !resetCalledRef.current) {
      resetCalledRef.current = true;
      toast.error(message || "That didn't work. Please try again.");

      const timer = setTimeout(() => {
        dispatch(reset());
        resetCalledRef.current = false;
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isError, message, dispatch]);

  // Reset refs on unmount
  useEffect(() => {
    return () => {
      navigatedRef.current = false;
      resetCalledRef.current = false;
    };
  }, []);

  // Reset PIN when enrollment ID changes
  useEffect(() => {
    setVisualPin(["", "", "", ""]);
    setLoginMode(null);
  }, [enrollmentId]);

  // Debounced student lookup
  useEffect(() => {
    if (!enrollmentId || enrollmentId.length < 3) {
      setFaceEnabled(null);
      setCheckingStudent(false);
      return;
    }

    latestEnrollRef.current = enrollmentId;
    setCheckingStudent(true);

    const timer = setTimeout(async () => {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/students/login-options`,
          { enrollmentId }
        );

        if (latestEnrollRef.current === enrollmentId) {
          setFaceEnabled(response.data.faceEnabled);
        }
      } catch {
        if (latestEnrollRef.current === enrollmentId) {
          setFaceEnabled(null);
        }
      } finally {
        if (latestEnrollRef.current === enrollmentId) {
          setCheckingStudent(false);
        }
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [enrollmentId]);

  // Select a picture for a PIN slot
  const handlePinTap = (index) => {
    setVisualPin((previous) => {
      const current = previous[index];

      const nextIndex = current
        ? (VISUAL_PIN_VALUES.indexOf(current) + 1) %
          VISUAL_PIN_VALUES.length
        : 0;

      const next = [...previous];
      next[index] = VISUAL_PIN_VALUES[nextIndex];

      return next;
    });
  };

  // Submit PIN login
  const handleSubmit = () => {
    if (checkingStudent || isLoading) return;

    if (!enrollmentId || visualPin.includes("")) {
      toast.error("Enter your ID and choose all 4 pictures first.");
      return;
    }

    navigatedRef.current = false;
    resetCalledRef.current = false;

    dispatch(studentLogin({ enrollmentId, visualPin }));
  };

  const allPinFilled = !visualPin.includes("");

  const handleFaceLogin = () => {
    navigate(
      `/student-face-login?enrollmentId=${encodeURIComponent(enrollmentId)}`
    );
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-bg px-5 py-6 sm:px-8">

      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
        />
      )}

      {/* Decorative background */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-light/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-accent-light/50 blur-3xl" />

      {/* Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between">

        <button
          onClick={() => navigate("/")}
          aria-label="Go back"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-brand transition hover:bg-brand-light"
        >
          <FiArrowLeft size={21} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-xl font-extrabold text-white">
            D
          </div>

          <div>
            <h1 className="text-xl font-extrabold text-brand-dark">
              DownX
            </h1>
            <p className="text-xs text-ink-soft">
              Learn. Grow. Shine.
            </p>
          </div>
        </div>

        <div className="w-11" />
      </header>

      {/* Main content */}
      <section className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center pt-12 sm:pt-16">

        {/* Welcome */}
        <div className="mb-9 text-center">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-light text-brand">
            <FiUser size={30} />
          </div>

          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-brand">
            Your learning space
          </p>

          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Hello, learner!
          </h2>

          <p className="mt-3 text-base leading-7 text-ink-soft">
            Enter your student ID to get started.
          </p>
        </div>

        {/* Student ID */}
        <div className="w-full">

          <label
            htmlFor="enrollmentId"
            className="mb-3 block text-sm font-bold text-ink"
          >
            Your Student ID
          </label>

          <input
            id="enrollmentId"
            type="text"
            autoComplete="off"
            placeholder="Example: DX-20260001"
            value={enrollmentId}
            onChange={(event) =>
              setEnrollmentId(event.target.value.toUpperCase())
            }
            className="w-full rounded-2xl border-2 border-border bg-surface px-5 py-5 text-center text-lg font-bold tracking-wider text-ink shadow-sm outline-none transition placeholder:font-normal placeholder:tracking-normal placeholder:text-ink-soft/60 focus:border-brand focus:ring-4 focus:ring-brand/10"
          />

        </div>

        {/* Checking account */}
        {checkingStudent && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <LoadingDots />
            <p className="text-sm font-semibold text-ink-soft">
              Looking for your account...
            </p>
          </div>
        )}

        {/* Login options */}
        {!checkingStudent && faceEnabled === true && !loginMode && (
          <div className="mt-8 w-full space-y-4">

            <p className="mb-5 text-center text-sm font-bold text-ink">
              Choose how you want to log in
            </p>

            <button
              onClick={handleFaceLogin}
              className="flex w-full items-center gap-4 rounded-2xl border-2 border-brand bg-brand p-5 text-left text-white shadow-sm transition hover:bg-brand-dark active:scale-[0.99]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <FiCamera size={25} />
              </div>

              <div className="flex-1">
                <span className="block text-lg font-extrabold">
                  Log in with my face
                </span>
                <span className="mt-1 block text-sm text-white/75">
                  Use the camera to log in.
                </span>
              </div>

              <FiArrowRight size={22} />
            </button>

            <button
              onClick={() => setLoginMode("pin")}
              className="flex w-full items-center gap-4 rounded-2xl border-2 border-border bg-surface p-5 text-left text-ink shadow-sm transition hover:border-brand hover:bg-brand-light/40 active:scale-[0.99]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-light text-accent-dark">
                <FiImage size={25} />
              </div>

              <div className="flex-1">
                <span className="block text-lg font-extrabold">
                  Log in with pictures
                </span>
                <span className="mt-1 block text-sm text-ink-soft">
                  Choose your four secret pictures.
                </span>
              </div>

              <FiArrowRight size={22} />
            </button>

          </div>
        )}

        {/* PIN only */}
        {!checkingStudent && faceEnabled === false && !loginMode && (
          <div className="mt-8 w-full">

            <button
              onClick={() => setLoginMode("pin")}
              className="flex w-full items-center gap-4 rounded-2xl bg-brand p-5 text-left text-white shadow-sm transition hover:bg-brand-dark active:scale-[0.99]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <FiImage size={25} />
              </div>

              <div className="flex-1">
                <span className="block text-lg font-extrabold">
                  Log in with pictures
                </span>
                <span className="mt-1 block text-sm text-white/75">
                  Choose your four secret pictures.
                </span>
              </div>

              <FiArrowRight size={22} />
            </button>

          </div>
        )}

        {/* Visual PIN */}
        {loginMode === "pin" && (
          <div className="mt-9 w-full">

            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-light text-accent-dark">
                <FiImage size={26} />
              </div>

              <h3 className="text-2xl font-extrabold text-ink">
                Your secret pictures
              </h3>

              <p className="mt-2 text-sm leading-6 text-ink-soft">
                Tap each box to find the picture in your secret code.
              </p>
            </div>

            {/* PIN slots */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {visualPin.map((value, index) => {
                const display = value
                  ? VISUAL_PIN_DISPLAY[value]
                  : null;

                const Icon = display?.Icon || FiHelpCircle;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePinTap(index)}
                    aria-label={
                      display
                        ? `Slot ${index + 1}: ${display.label}`
                        : `Slot ${index + 1}: empty`
                    }
                    className={`relative flex aspect-square items-center justify-center rounded-2xl border-2 shadow-sm transition hover:-translate-y-1 active:scale-95 focus-visible:outline focus-visible:outline-3 focus-visible:outline-brand ${
                      display
                        ? `${display.bg} border-transparent ring-2 ${display.ring}`
                        : "border-border bg-surface"
                    }`}
                  >
                    <span className="absolute left-2 top-2 text-xs font-bold text-ink-soft/70">
                      {index + 1}
                    </span>

                    <Icon
                      size={32}
                      className={display ? display.icon : "text-ink-soft"}
                    />

                    {display && (
                      <FiCheckCircle
                        className="absolute right-2 top-2 text-success"
                        size={16}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* PIN labels */}
            <div className="mt-5 rounded-xl bg-brand-light/70 px-4 py-3 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-brand">
                Your selected pictures
              </p>

              <p className="mt-2 text-sm font-semibold text-ink">
                {visualPin
                  .map((value) =>
                    value ? VISUAL_PIN_DISPLAY[value].label : "Not selected"
                  )
                  .join("  •  ")}
              </p>
            </div>

            {/* Progress */}
            <p className="mt-4 text-center text-sm font-semibold text-ink-soft">
              {visualPin.filter(Boolean).length} of 4 pictures selected
            </p>

            {/* Continue */}
            <button
              onClick={handleSubmit}
              disabled={isLoading || !allPinFilled || checkingStudent}
              className={`mt-5 flex w-full items-center justify-center gap-3 rounded-2xl py-5 text-lg font-extrabold text-white shadow-sm transition active:scale-[0.99] ${
                allPinFilled && !isLoading
                  ? "bg-brand hover:bg-brand-dark"
                  : "cursor-not-allowed bg-border text-ink-soft"
              }`}
            >
              {isLoading ? (
                <LoadingDots />
              ) : (
                <>
                  Continue
                  <FiArrowRight size={21} />
                </>
              )}
            </button>

            {/* Other options */}
            <button
              onClick={() => setLoginMode(null)}
              className="mt-5 w-full rounded-xl py-3 text-sm font-bold text-brand transition hover:bg-brand-light"
            >
              Choose another login method
            </button>

          </div>
        )}

        {/* Helper */}
        {!loginMode && !checkingStudent && (
          <p className="mt-8 max-w-sm text-center text-sm leading-6 text-ink-soft">
            Need help? Ask your teacher or parent to help you find your student ID.
          </p>
        )}

      </section>

      {/* Footer */}
      <footer className="relative z-10 mx-auto mt-16 max-w-6xl border-t border-border pt-6 text-center">
        <p className="text-xs text-ink-soft">
          DownX · Learn. Grow. Shine.
        </p>
        <p className="mt-1 text-xs text-ink-soft/70">
          Every little step is a big achievement.
        </p>
      </footer>

    </main>
  );
};

export default StudentLoginPage;
