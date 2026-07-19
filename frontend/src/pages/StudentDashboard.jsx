import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import { reset as resetStudent } from "../features/student/studentSlice";
import {
  getAllTasks,
  markTaskComplete,
  unmarkTaskComplete,
  verifyObjectForTask,
  startTask,
} from "../features/task/taskSlice";
import GestureDetector from "../components/gesture/GestureDetector";
import ObjectDetector from "../components/object/ObjectDetector";
import PictogramBoard from "../components/PictogramBoard";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { scorePronunciation, speakText } from "../utils/speechUtils";
import toast from "react-hot-toast";
import axios from "axios";
import {
  FiLogOut,
  FiStar,
  FiVolume2,
  FiMic,
  FiSquare,
  FiRotateCcw,
  FiCheck,
  FiX,
  FiCamera,
  FiLoader,
  FiAward,
  FiArrowRight,
} from "react-icons/fi";

const BASE_URL = import.meta.env.VITE_API_URL;

// Consistent, calm accent cycle — one of the four design-system colors
// per task, never a random rainbow. Background stays constant across
// tasks so the environment feels predictable, not novel every time.
const TASK_ACCENTS = [
  { name: "brand", bg: "bg-brand", bgLight: "bg-brand-light", text: "text-brand" },
  { name: "accent", bg: "bg-accent", bgLight: "bg-accent-light", text: "text-accent-dark" },
  { name: "success", bg: "bg-success", bgLight: "bg-success-light", text: "text-success" },
  { name: "warn", bg: "bg-warn", bgLight: "bg-warn-light", text: "text-warn" },
];

const getEid = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1])).enrollmentId || null;
  } catch {
    return null;
  }
};

// ── Speech sheet ──────────────────────────────────────────────────────────
const SpeechSheet = ({ stepText, stepIndex, taskId, eid, onPts, onClose }) => {
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    setResult(null);
    resetTranscript();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepText]);

  useEffect(() => {
    if (!transcript || isListening || !stepText) return;
    const r = scorePronunciation(transcript, stepText);
    setResult(r);
    if (eid && taskId) {
      setSaving(true);
      axios
        .post(`${BASE_URL}/api/speech/log`, {
          enrollmentId: eid,
          taskId,
          stepIndex,
          stepText,
          spokenText: transcript,
          score: r.score,
          matchedWords: r.matchedWords,
          missedWords: r.missedWords,
        })
        .then((res) => {
          if (res.data.pointsAwarded > 0) onPts(res.data.pointsAwarded);
        })
        .catch(() => {})
        .finally(() => setSaving(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, isListening]);

  if (!isSupported) {
    onClose();
    return null;
  }

  const sc = result?.score ?? 0;
  const scoreState = sc >= 80 ? "success" : sc >= 50 ? "warn" : "danger";
  const scoreClasses = {
    success: { text: "text-success", bg: "bg-success-light" },
    warn: { text: "text-warn", bg: "bg-warn-light" },
    danger: { text: "text-danger", bg: "bg-danger-light" },
  }[scoreState];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end bg-black/50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-surface rounded-t-3xl px-5 pt-5 pb-11 flex flex-col gap-4"
      >
        <div className="w-10 h-1 rounded-full bg-border mx-auto" />

        <div className="flex items-center justify-between">
          <span className="text-lg font-extrabold text-ink flex items-center gap-2">
            <FiMic className="text-brand" /> Say this step
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-lg bg-bg flex items-center justify-center focus-visible:outline focus-visible:outline-3"
          >
            <FiX size={18} className="text-ink-soft" />
          </button>
        </div>

        <div className="bg-brand-light rounded-2xl px-4 py-4 text-center">
          <p className="text-lg font-extrabold text-ink m-0">{stepText}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => speakText(stepText, { rate: 0.7 })}
            className="bg-brand-light text-brand rounded-2xl py-4 text-base font-extrabold flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-3"
          >
            <FiVolume2 size={20} /> Hear it
          </button>
          <button
            onClick={() => {
              if (isListening) stopListening();
              else {
                resetTranscript();
                setResult(null);
                startListening();
              }
            }}
            className={`rounded-2xl py-4 text-base font-extrabold flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-3 ${
              isListening
                ? "bg-danger-light text-danger"
                : "bg-success-light text-success"
            }`}
          >
            {isListening ? (
              <>
                <FiSquare size={18} /> Stop
              </>
            ) : (
              <>
                <FiMic size={20} /> Speak
              </>
            )}
          </button>
        </div>

        {isListening && (
          <p className="text-center text-danger font-bold text-sm m-0">
            Listening…
          </p>
        )}

        {result && (
          <div
            className={`${scoreClasses.bg} rounded-2xl p-4 flex items-center gap-4`}
          >
            <div
              className={`rounded-full bg-surface flex items-center justify-center text-lg font-extrabold ${scoreClasses.text} flex-shrink-0`}
              style={{ width: 52, height: 52 }}
            >
              {sc}
            </div>
            <div>
              <p className="text-base font-bold text-ink m-0">
                {result.feedback}
              </p>
              {result.missedWords.length > 0 && (
                <p className="text-sm text-ink-soft mt-1 m-0">
                  Try:{" "}
                  <strong className="text-danger">
                    {result.missedWords.slice(0, 3).join(", ")}
                  </strong>
                </p>
              )}
            </div>
          </div>
        )}

        {result && (
          <button
            onClick={() => {
              resetTranscript();
              setResult(null);
            }}
            className="bg-bg text-ink-soft rounded-2xl py-3 text-sm font-bold flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-3"
          >
            <FiRotateCcw size={16} /> Try again
          </button>
        )}
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════
//  MAIN
// ═════════════════════════════════════════════════════════════════════════
export default function StudentDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const { tasks = [], loading, error, verifiedTasks } = useSelector((s) => s.task);

  const [taskIdx, setTaskIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [screen, setScreen] = useState("step"); // "step"|"reward"
  const [pts, setPts] = useState(0);
  const [ptsRef, setPtsRef] = useState(0);
  const [showSpeech, setShowSpeech] = useState(false);

  const token = localStorage.getItem("studentToken") || user?.token;
  const eid = useMemo(() => {
    const st = localStorage.getItem("studentToken");
    return getEid(st) || user?.enrollmentId || null;
  }, [user]);

  useEffect(() => {
    if (token) dispatch(getAllTasks(token));
    else navigate("/student-login");
  }, [dispatch, token, navigate]);

  useEffect(() => {
    if (!eid) return;
    axios
      .get(`${BASE_URL}/api/gamification/student/${eid}`)
      .then((r) => {
        if (r.data.success) setPts(r.data.total);
      })
      .catch(() => {});
  }, [eid, ptsRef]);

  const doLogout = () => {
    localStorage.removeItem("studentToken");
    dispatch(logout());
    dispatch(resetStudent());
    navigate("/", { replace: true });
  };

  const activeTasks = tasks.filter((t) => !t.isCompletedByMe);

  // Adaptive Learning (Days 70-75): tell the backend when the student
  // opens the current active task, so completeTask can measure
  // time-to-completion. Fires once per task per session.
  const startedTaskIds = useRef(new Set());
  useEffect(() => {
    if (!token || !activeTasks.length) return;
    const idx = Math.min(taskIdx, activeTasks.length - 1);
    const currentTaskId = activeTasks[idx]?._id;
    if (!currentTaskId || startedTaskIds.current.has(currentTaskId)) return;
    startedTaskIds.current.add(currentTaskId);
    dispatch(startTask({ id: currentTaskId, token }));
  }, [taskIdx, activeTasks, token, dispatch]);

  const handleObjVerified = useCallback(
    (labels) => {
      const tid = activeTasks[taskIdx]?._id;
      if (!tid || !eid) return;
      const sc = {};
      labels.forEach((l) => (sc[l] = 1.0));
      dispatch(
        verifyObjectForTask({
          taskId: tid,
          enrollmentId: eid,
          detectedObjects: labels,
          confidenceScores: sc,
        }),
      );
      toast.success("Objects verified!");
      axios
        .post(`${BASE_URL}/api/gamification/award`, {
          enrollmentId: eid,
          event: "object_verified",
          taskId: tid,
        })
        .then(() => setPtsRef((n) => n + 1))
        .catch(() => {});
    },
    [activeTasks, taskIdx, eid, dispatch],
  );

  // ── Guards ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <FullScreenState
        icon={<FiLoader size={48} className="text-brand animate-spin" />}
        text="Getting your tasks…"
        textClass="text-brand"
      />
    );
  }

  if (error) {
    return (
      <FullScreenState
        icon={<FiX size={48} className="text-danger" />}
        text="Something went wrong."
        textClass="text-danger"
        action={
          <button
            onClick={() => {
              if (token) dispatch(getAllTasks(token));
            }}
            className="bg-brand text-white rounded-2xl px-8 py-4 text-lg font-extrabold focus-visible:outline focus-visible:outline-3"
          >
            Try again
          </button>
        }
      />
    );
  }

  if (!tasks.length) {
    return (
      <FullScreenState
        icon={<FiStar size={48} className="text-warn" />}
        text="No tasks yet"
        textClass="text-warn"
        subtext="Your teacher will add some soon."
        action={
          <button
            onClick={doLogout}
            className="bg-warn text-white rounded-2xl px-8 py-4 text-lg font-extrabold flex items-center gap-2 focus-visible:outline focus-visible:outline-3"
          >
            <FiLogOut size={18} /> Log out
          </button>
        }
      />
    );
  }

  if (screen === "reward") {
    return (
      <div className="min-h-dvh flex flex-col justify-between bg-bg p-5">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-success">
            <FiStar size={16} /> {pts} points
          </span>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 gap-5">
          <div
            className="w-24 h-24 rounded-full bg-success-light flex items-center justify-center"
            style={{ boxShadow: "0 0 0 4px var(--color-success)" }}
          >
            <FiAward size={44} className="text-success" />
          </div>
          <div className="text-3xl font-extrabold text-success text-center">
            Great job!
          </div>
          <div className="text-lg text-success text-center font-semibold">
            You finished the task.
            <br />
            Amazing work.
          </div>
        </div>
        <div className="text-center">
          {activeTasks.length > 0 ? (
            <button
              className="w-full bg-success text-white rounded-2xl py-6 text-2xl font-extrabold flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-3"
              onClick={() => {
                setScreen("step");
                setStepIdx(0);
                setTaskIdx(0);
              }}
            >
              Next task <FiArrowRight size={24} />
            </button>
          ) : (
            <>
              <div className="text-xl font-bold text-success mb-4">
                All done for today
              </div>
              <button
                onClick={doLogout}
                className="w-full bg-ink-soft text-white rounded-2xl py-5 text-xl font-extrabold flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-3"
              >
                <FiLogOut size={18} /> Log out
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!activeTasks.length) {
    return (
      <FullScreenState
        icon={<FiAward size={48} className="text-success" />}
        text="All tasks done"
        textClass="text-success"
        subtext="Amazing work today."
        action={
          <button
            onClick={doLogout}
            className="bg-success text-white rounded-2xl px-8 py-4 text-lg font-extrabold flex items-center gap-2 focus-visible:outline focus-visible:outline-3"
          >
            <FiLogOut size={18} /> Log out
          </button>
        }
      />
    );
  }

  // ── Safe task data ───────────────────────────────────────────────────
  const safeTaskIdx = Math.min(taskIdx, activeTasks.length - 1);
  const task = activeTasks[safeTaskIdx];
  const taskId = task._id;
  const steps = task.simplifiedSteps || [];
  const safeStepIdx = Math.min(stepIdx, Math.max(steps.length - 1, 0));
  const step = steps[safeStepIdx] || "";
  const objV = task.objectVerification;
  const objOn = objV?.enabled && objV?.requiredObjects?.length > 0;
  const objOk = verifiedTasks?.[taskId] || false;
  const isLastStep = safeStepIdx === steps.length - 1;
  const accent = TASK_ACCENTS[safeTaskIdx % TASK_ACCENTS.length];

  const handleStepDone = () => {
    if (isLastStep) {
      if (token && taskId) {
        dispatch(markTaskComplete({ id: taskId, token }));
        if (eid) {
          axios
            .post(`${BASE_URL}/api/gamification/award`, {
              enrollmentId: eid,
              event: "task_complete",
              taskId,
            })
            .then((r) => {
              if (r.data.pointsAwarded > 0) setPtsRef((n) => n + 1);
            })
            .catch(() => {});
        }
      }
      setScreen("reward");
    } else {
      setStepIdx(safeStepIdx + 1);
      setScreen("step");
    }
  };
  //  STEP SCREEN — with real-image pictogram board
  // ════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-dvh flex flex-col justify-between bg-bg p-5 overflow-y-auto gap-4">
      {/* TOP BAR */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full ${accent.bg} text-white flex items-center justify-center text-base font-extrabold flex-shrink-0`}
          >
            {(user?.name || "S")[0].toUpperCase()}
          </div>
          <div>
            <div
              className={`text-xs font-bold ${accent.text} uppercase tracking-wide`}
            >
              Hello
            </div>
            <div className="text-base font-extrabold text-ink leading-none">
              {user?.name || "Student"}
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div
            className={`bg-surface rounded-xl px-3 py-1.5 text-sm font-extrabold ${accent.text} flex items-center gap-1.5`}
          >
            <FiStar size={14} /> {pts} pts
          </div>
          <button
            onClick={doLogout}
            aria-label="Log out"
            className="bg-surface rounded-xl px-3 py-2 text-danger focus-visible:outline focus-visible:outline-3"
          >
            <FiLogOut size={16} />
          </button>
        </div>
      </div>

      {/* FIRST → THEN */}
      <div className="flex-shrink-0">
        <div className="text-xs font-bold text-ink-soft uppercase tracking-wide text-center mb-2">
          {task.title}
        </div>
        <div className="flex items-stretch gap-2">
          {/* FIRST — current step, highlighted */}
          <div
            className={`flex-1 rounded-2xl px-3 py-3 ${accent.bgLight} border-2`}
            style={{ borderColor: `var(--color-${accent.name})` }}
          >
            <div className={`text-xs font-extrabold uppercase tracking-wide mb-1 ${accent.text}`}>
              First
            </div>
            <div className="text-sm font-bold text-ink leading-snug line-clamp-2">
              {step}
            </div>
          </div>

          <div className="flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <FiArrowRight size={20} className="text-ink-soft" />
          </div>

          {/* THEN — next step, or reward if this is the last one */}
          <div className="flex-1 rounded-2xl px-3 py-3 bg-surface border-2 border-border opacity-70">
            <div className="text-xs font-extrabold uppercase tracking-wide mb-1 text-ink-soft">
              Then
            </div>
            <div className="text-sm font-bold text-ink-soft leading-snug line-clamp-2 flex items-center gap-1.5">
              {isLastStep ? (
                <>
                  <FiAward size={16} className="flex-shrink-0" /> All done
                </>
              ) : (
                steps[safeStepIdx + 1]
              )}
            </div>
          </div>
        </div>

        {/* Small dot trail for orientation only — not a "step count" the
            student has to track, just a subtle sense of "some left" */}
        {steps.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === safeStepIdx ? `w-5 ${accent.bg}` : i < safeStepIdx ? "w-1.5 bg-success" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* CAMERA BANNER */}
      {objOn && (
        <div
          className={`rounded-2xl px-4 py-3 flex items-center gap-3 text-base font-bold flex-shrink-0 border-2 ${
            objOk
              ? "bg-success-light border-success text-success"
              : "bg-surface border-border text-ink"
          }`}
        >
          {objOk ? <FiCheck size={22} /> : <FiCamera size={22} />}
          <span>
            {objOk
              ? "Camera check done"
              : objV.verificationInstruction ||
                `Show: ${objV.requiredObjects.join(", ")}`}
          </span>
        </div>
      )}

      {/* PICTOGRAM BOARD — the primary visual, shown first */}
      <div className="flex-shrink-0">
        <PictogramBoard
          stepText={step}
          onAllTicked={() => {
            // Optional: auto-open confirm when all pictures tapped
          }}
        />
      </div>

      {/* STEP TEXT — caption under the picture, not the lead element */}
      <div className="text-center flex-shrink-0">
        <div className="text-lg font-bold text-ink leading-snug max-w-xs mx-auto">
          {step}
        </div>
        <button
          onClick={() => speakText(step, { rate: 0.7 })}
          className="mt-3 bg-surface rounded-2xl px-5 py-3 text-base font-bold text-ink flex items-center gap-2 mx-auto focus-visible:outline focus-visible:outline-3"
        >
          <FiVolume2 size={18} /> Listen
        </button>
      </div>

      {/* BOTTOM ACTIONS */}
      <div className="text-center flex-shrink-0 pt-2">
        <button
          onClick={() => setShowSpeech(true)}
          className="w-full py-4 mb-3 text-base font-extrabold rounded-2xl bg-surface text-brand flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-3"
        >
          <FiMic size={18} /> Practice speaking
        </button>

        <button
          onClick={handleStepDone}
          className={`w-full ${accent.bg} text-white rounded-2xl py-6 text-2xl font-extrabold shadow-sm flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-3`}
        >
          {isLastStep ? (
            <>
              I did it <FiCheck size={26} />
            </>
          ) : (
            <>
              Next <FiArrowRight size={22} />
            </>
          )}
        </button>

        {activeTasks.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {activeTasks.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setTaskIdx(i);
                  setStepIdx(0);
                  setScreen("step");
                }}
                aria-label={`Go to task ${i + 1}`}
                className={`h-2 rounded-full transition-all focus-visible:outline focus-visible:outline-3 ${
                  i === safeTaskIdx ? `w-6 ${accent.bg}` : "w-2 bg-border"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* SPEECH SHEET */}
      {showSpeech && (
        <SpeechSheet
          stepText={step}
          stepIndex={safeStepIdx}
          taskId={taskId}
          eid={eid}
          onPts={(p) => {
            toast.success(`+${p} points`);
            setPtsRef((n) => n + 1);
          }}
          onClose={() => setShowSpeech(false)}
        />
      )}

      {/* Background detectors */}
      <GestureDetector
        enrollmentId={eid}
        taskId={taskId || null}
        isEnabled={true}
        onGestureDetected={(g) => console.log("Gesture:", g)}
      />
      <ObjectDetector
        requiredObjects={objV?.requiredObjects || []}
        taskId={taskId || null}
        isEnabled={true}
        onVerified={handleObjVerified}
      />
    </div>
  );
}

// Shared full-screen state (loading / error / empty / all-done)
function FullScreenState({ icon, text, textClass, subtext, action }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-5 bg-bg px-6 text-center">
      <div
        className="w-24 h-24 rounded-full bg-surface flex items-center justify-center"
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className={`text-2xl font-extrabold ${textClass}`}>{text}</div>
      {subtext && <div className="text-base text-ink-soft">{subtext}</div>}
      {action}
    </div>
  );
}