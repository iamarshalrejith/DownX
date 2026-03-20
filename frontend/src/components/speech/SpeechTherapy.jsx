import { useState, useEffect, useCallback } from "react";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";
import { scorePronunciation, speakText } from "../../utils/speechUtils";
import { Mic, MicOff, Volume2, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

// Small animated score ring
const ScoreRing = ({ score }) => {
  const r    = 26, size = 64;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={32} cy={32} r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
      <circle cx={32} cy={32} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 32 32)"
        style={{ transition: "stroke-dasharray 0.5s ease" }}
      />
      <text x="50%" y="53%" dominantBaseline="middle" textAnchor="middle"
        fontSize="14" fontWeight="600" fill={color}>{score}</text>
    </svg>
  );
};

/**
 * SpeechTherapy
 *
 * Props:
 *   stepText     — current task step string  e.g. "Pick up the cup"
 *   stepIndex    — 0-based step number
 *   taskId       — MongoDB task _id
 *   enrollmentId — student's enrollment ID
 *   onPointsEarned(pts) — callback when speech earns gamification points
 */
const SpeechTherapy = ({
  stepText    = "",
  stepIndex   = 0,
  taskId      = null,
  enrollmentId = null,
  onPointsEarned = () => {},
}) => {
  const [isOpen,    setIsOpen]    = useState(false);
  const [result,    setResult]    = useState(null);
  const [bestScore, setBestScore] = useState(0);
  const [attempts,  setAttempts]  = useState(0);
  const [saving,    setSaving]    = useState(false);

  const { transcript, isListening, isSupported,
          startListening, stopListening, resetTranscript } = useSpeechRecognition();

  // Score when transcript arrives
  useEffect(() => {
    if (!transcript || isListening || !stepText) return;
    const r = scorePronunciation(transcript, stepText);
    setResult(r);
    setAttempts((a) => a + 1);
    if (r.score > bestScore) setBestScore(r.score);

    // Save to backend + award points
    if (enrollmentId && taskId) {
      setSaving(true);
      axios.post(`${BASE_URL}/api/speech/log`, {
        enrollmentId, taskId, stepIndex,
        stepText, spokenText: transcript,
        score: r.score,
        matchedWords: r.matchedWords,
        missedWords:  r.missedWords,
      })
        .then((res) => {
          if (res.data.pointsAwarded > 0) onPointsEarned(res.data.pointsAwarded);
        })
        .catch(() => {}) // silent fail — don't break student experience
        .finally(() => setSaving(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, isListening]);

  // Reset when step changes
  useEffect(() => {
    setResult(null);
    setAttempts(0);
    setBestScore(0);
    resetTranscript();
  }, [stepText, resetTranscript]);

  if (!isSupported) return null;

  const handleSpeak  = () => { if (isListening) stopListening(); else { resetTranscript(); setResult(null); startListening(); } };
  const handleHear   = () => speakText(stepText);
  const handleReset  = () => { stopListening(); resetTranscript(); setResult(null); };

  return (
    <div className="fixed bottom-32 right-4 z-40 w-72 rounded-2xl shadow-xl border-2 border-blue-300 bg-white overflow-hidden">

      {/* Header */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-blue-600 text-white"
      >
        <div className="flex items-center gap-2">
          <Mic size={16} />
          <span className="text-sm font-bold">Speech Practice</span>
          {bestScore > 0 && (
            <span className="bg-white/25 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
              Best: {bestScore}%
            </span>
          )}
        </div>
        {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {isOpen && (
        <div className="p-4 space-y-3">

          {/* Step text */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs text-blue-500 font-semibold mb-1">Say this out loud:</p>
            <p className="text-sm font-bold text-blue-900 leading-snug">{stepText || "No step loaded"}</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button onClick={handleHear}
              className="flex-1 flex items-center justify-center gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200 text-sm font-bold py-3 rounded-xl transition">
              <Volume2 size={15} /> Hear It
            </button>
            <button onClick={handleSpeak}
              className={`flex-1 flex items-center justify-center gap-1 text-sm font-bold py-3 rounded-xl transition ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}>
              {isListening ? <><MicOff size={15} /> Stop</> : <><Mic size={15} /> Speak</>}
            </button>
          </div>

          {/* Listening pulse */}
          {isListening && (
            <div className="flex items-center justify-center gap-2 text-red-500 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
              Listening…
            </div>
          )}

          {/* What you said */}
          {transcript && !isListening && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5">
              <p className="text-xs text-gray-400 mb-0.5">You said:</p>
              <p className="text-sm text-gray-700 italic">"{transcript}"</p>
            </div>
          )}

          {/* Score result */}
          {result && (
            <div className={`rounded-xl p-3 flex items-center gap-3 border ${
              result.score >= 80 ? "bg-green-50 border-green-200"
                : result.score >= 50 ? "bg-yellow-50 border-yellow-200"
                : "bg-red-50 border-red-200"
            }`}>
              <ScoreRing score={result.score} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 leading-snug">{result.feedback}</p>
                {result.missedWords.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Try: <span className="text-red-600 font-semibold">{result.missedWords.slice(0, 4).join(", ")}</span>
                  </p>
                )}
                {saving && <p className="text-xs text-blue-400 mt-1">Saving…</p>}
              </div>
            </div>
          )}

          {/* Attempt count + reset */}
          {attempts > 0 && (
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Attempt {attempts}</span>
              <button onClick={handleReset} className="flex items-center gap-1 text-blue-500 hover:text-blue-700">
                <RotateCcw size={12} /> Try again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpeechTherapy;