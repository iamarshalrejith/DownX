import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiMic,
  FiSquare,
  FiVolume2,
  FiRotateCcw,
  FiCheck,
  FiX,
  FiUser,
  FiBookOpen,
} from "react-icons/fi";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { scorePronunciation, speakText } from "../utils/speechUtils";

const BASE_URL = import.meta.env.VITE_API_URL;

const getEid = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1])).enrollmentId || null;
  } catch {
    return null;
  }
};

// ── Practice detail view for one phrase ────────────────────────────────
const PracticeDetail = ({ phrase, eid, onBack, onPointsEarned }) => {
  const [result, setResult] = useState(null);
  const {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    if (!transcript || isListening) return;
    const r = scorePronunciation(transcript, phrase);
    setResult(r);
    if (eid) {
      axios
        .post(`${BASE_URL}/api/speech/log`, {
          enrollmentId: eid,
          // Standalone practice isn't tied to a task; the backend
          // requires a taskId, so this endpoint is skipped gracefully
          // if not available — practicing still works, just isn't logged.
          taskId: null,
          stepIndex: 0,
          stepText: phrase,
          spokenText: transcript,
          score: r.score,
          matchedWords: r.matchedWords,
          missedWords: r.missedWords,
        })
        .then((res) => {
          if (res.data?.pointsAwarded > 0) onPointsEarned(res.data.pointsAwarded);
        })
        .catch(() => {
          // Standalone practice logging is best-effort only
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, isListening]);

  if (!isSupported) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-bold text-ink">
          Speech practice isn't supported in this browser.
        </p>
        <button
          onClick={onBack}
          className="bg-brand text-white rounded-2xl px-6 py-3 font-extrabold focus-visible:outline focus-visible:outline-3"
        >
          Go back
        </button>
      </div>
    );
  }

  const sc = result?.score ?? 0;
  const scoreState = sc >= 80 ? "success" : sc >= 50 ? "warn" : "danger";
  const scoreClasses = {
    success: { text: "text-success", bg: "bg-success-light" },
    warn: { text: "text-warn", bg: "bg-warn-light" },
    danger: { text: "text-danger", bg: "bg-danger-light" },
  }[scoreState];

  return (
    <div className="min-h-dvh bg-bg flex flex-col p-5 gap-5">
      <button
        onClick={onBack}
        aria-label="Back to practice list"
        className="w-12 h-12 rounded-full bg-surface border-2 border-border flex items-center justify-center focus-visible:outline focus-visible:outline-3"
      >
        <FiArrowLeft size={20} className="text-ink" />
      </button>

      <div className="flex flex-col items-center gap-6 flex-1 justify-center">
        <div className="bg-brand-light rounded-3xl px-6 py-6 text-center max-w-sm">
          <p className="text-2xl font-extrabold text-ink leading-snug m-0">{phrase}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          <button
            onClick={() => speakText(phrase, { rate: 0.7 })}
            className="bg-surface border-2 border-border text-ink rounded-2xl py-5 text-lg font-extrabold flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-3"
          >
            <FiVolume2 size={22} /> Hear it
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
            className={`rounded-2xl py-5 text-lg font-extrabold flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-3 ${
              isListening ? "bg-danger-light text-danger" : "bg-success text-white"
            }`}
          >
            {isListening ? (
              <>
                <FiSquare size={20} /> Stop
              </>
            ) : (
              <>
                <FiMic size={22} /> Speak
              </>
            )}
          </button>
        </div>

        {isListening && (
          <p className="text-danger font-bold text-base">Listening…</p>
        )}

        {result && (
          <div className={`${scoreClasses.bg} rounded-2xl p-5 flex items-center gap-4 w-full max-w-sm`}>
            <div
              className={`rounded-full bg-surface flex items-center justify-center text-xl font-extrabold ${scoreClasses.text} flex-shrink-0`}
              style={{ width: 60, height: 60 }}
            >
              {sc}
            </div>
            <div>
              <p className="text-base font-bold text-ink m-0">{result.feedback}</p>
              {result.missedWords.length > 0 && (
                <p className="text-sm text-ink-soft mt-1 m-0">
                  Try: <strong className="text-danger">{result.missedWords.slice(0, 3).join(", ")}</strong>
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
            className="text-ink-soft font-bold text-base flex items-center gap-2 focus-visible:outline focus-visible:outline-3"
          >
            <FiRotateCcw size={16} /> Try again
          </button>
        )}
      </div>
    </div>
  );
};

// ── List view ───────────────────────────────────────────────────────────
export default function StudentSpeechPractice() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const [teacherItems, setTeacherItems] = useState([]);
  const [taskWords, setTaskWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const eid = React.useMemo(() => {
    const st = localStorage.getItem("studentToken");
    return getEid(st) || user?.enrollmentId || null;
  }, [user]);

  useEffect(() => {
    if (!eid) {
      setLoading(false);
      return;
    }
    axios
      .get(`${BASE_URL}/api/speech/practice/student/${eid}`)
      .then((res) => {
        if (res.data.success) {
          setTeacherItems(res.data.teacherItems || []);
          setTaskWords(res.data.taskWords || []);
        }
      })
      .catch(() => {
        toast.error("Couldn't load practice list.");
      })
      .finally(() => setLoading(false));
  }, [eid]);

  if (selected) {
    return (
      <PracticeDetail
        phrase={selected}
        eid={eid}
        onBack={() => setSelected(null)}
        onPointsEarned={(p) => toast.success(`+${p} points`)}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col p-5 gap-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/student-dashboard")}
          aria-label="Back to tasks"
          className="w-12 h-12 rounded-full bg-surface border-2 border-border flex items-center justify-center focus-visible:outline focus-visible:outline-3"
        >
          <FiArrowLeft size={20} className="text-ink" />
        </button>
        <div>
          <div className="text-xs font-bold text-brand uppercase tracking-wide">Speech Practice</div>
          <div className="text-lg font-extrabold text-ink leading-none">Pick something to say</div>
        </div>
      </div>

      {loading && (
        <p className="text-center text-ink-soft font-bold mt-10">Loading your practice list…</p>
      )}

      {!loading && teacherItems.length === 0 && taskWords.length === 0 && (
        <p className="text-center text-ink-soft font-bold mt-10">
          Nothing to practice yet — check back after your teacher adds something, or finish a task first.
        </p>
      )}

      {!loading && teacherItems.length > 0 && (
        <div>
          <div className="text-xs font-bold text-ink-soft uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <FiUser size={14} /> From your teacher
          </div>
          <div className="flex flex-col gap-2">
            {teacherItems.map((item) => (
              <button
                key={item._id}
                onClick={() => setSelected(item.phrase)}
                className="w-full text-left bg-surface border-2 border-border rounded-2xl px-4 py-4 text-base font-bold text-ink focus-visible:outline focus-visible:outline-3"
              >
                {item.phrase}
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && taskWords.length > 0 && (
        <div>
          <div className="text-xs font-bold text-ink-soft uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <FiBookOpen size={14} /> From your tasks
          </div>
          <div className="flex flex-col gap-2">
            {taskWords.map((word, i) => (
              <button
                key={`${word}-${i}`}
                onClick={() => setSelected(word)}
                className="w-full text-left bg-surface border-2 border-border rounded-2xl px-4 py-4 text-base font-bold text-ink focus-visible:outline focus-visible:outline-3"
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}