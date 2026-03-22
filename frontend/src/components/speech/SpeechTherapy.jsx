/**
 * SpeechTherapy.jsx
 *
 * FIXES APPLIED:
 * 1. Starts OPEN by default — DS students must not have to discover a hidden widget
 * 2. Moved from fixed bottom-right floating to an inline card inside the dashboard
 * 3. Buttons are much larger (full-width, tall tap targets) — motor difficulty friendly
 * 4. Text sizes bumped up throughout
 * 5. Cleaner, friendlier visual design
 */

import { useState, useEffect } from "react";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";
import { scorePronunciation, speakText } from "../../utils/speechUtils";
import { Mic, MicOff, Volume2, RotateCcw } from "lucide-react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

const ScoreRing = ({ score }) => {
  const r = 30,
    size = 72;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={36}
        cy={36}
        r={r}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="6"
      />
      <circle
        cx={36}
        cy={36}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text
        x="50%"
        y="53%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        fill={color}
      >
        {score}
      </text>
    </svg>
  );
};

const SpeechTherapy = ({
  stepText = "",
  stepIndex = 0,
  taskId = null,
  enrollmentId = null,
  onPointsEarned = () => {},
}) => {
  // OPEN BY DEFAULT — fix #2
  const [isOpen, setIsOpen] = useState(true);
  const [result, setResult] = useState(null);
  const [bestScore, setBestScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
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
    if (!transcript || isListening || !stepText) return;
    const r = scorePronunciation(transcript, stepText);
    setResult(r);
    setAttempts((a) => a + 1);
    if (r.score > bestScore) setBestScore(r.score);

    if (enrollmentId && taskId) {
      setSaving(true);
      axios
        .post(`${BASE_URL}/api/speech/log`, {
          enrollmentId,
          taskId,
          stepIndex,
          stepText,
          spokenText: transcript,
          score: r.score,
          matchedWords: r.matchedWords,
          missedWords: r.missedWords,
        })
        .then((res) => {
          if (res.data.pointsAwarded > 0)
            onPointsEarned(res.data.pointsAwarded);
        })
        .catch(() => {})
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
    stopListening();
  }, [stepText, resetTranscript, stopListening]);

  if (!isSupported) return null;

  const handleSpeak = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setResult(null);
      startListening();
    }
  };

  return (
    <div className="w-full rounded-3xl border-4 border-blue-300 bg-white overflow-hidden shadow-lg mt-4">
      {/* Header — tappable to collapse/expand */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-blue-600 text-white"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎤</span>
          <div className="text-left">
            <p className="text-xl font-extrabold leading-none">
              Speech Practice
            </p>
            <p className="text-sm text-blue-200 mt-0.5">
              Say the step out loud!
            </p>
          </div>
          {bestScore > 0 && (
            <span className="bg-white/25 text-white text-sm px-3 py-1 rounded-full font-bold ml-2">
              Best: {bestScore}%
            </span>
          )}
        </div>
        <span className="text-2xl">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="p-5 space-y-4">
          {/* Current step display */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 text-center">
            <p className="text-sm text-blue-500 font-bold mb-1 uppercase tracking-wide">
              Say this:
            </p>
            <p className="text-2xl font-extrabold text-blue-900 leading-snug">
              {stepText || "No step loaded"}
            </p>
          </div>

          {/* Main buttons — large tap targets */}
          <div className="grid grid-cols-2 gap-3">
            {/* Hear it */}
            <button
              onClick={() => speakText(stepText)}
              className="flex flex-col items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white py-5 rounded-2xl font-bold text-lg transition shadow"
            >
              <Volume2 size={28} />
              <span>Hear It</span>
            </button>

            {/* Speak */}
            <button
              onClick={handleSpeak}
              className={`flex flex-col items-center justify-center gap-2 py-5 rounded-2xl font-bold text-lg transition shadow ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff size={28} />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Mic size={28} />
                  <span>Speak</span>
                </>
              )}
            </button>
          </div>

          {/* Listening indicator */}
          {isListening && (
            <div className="flex items-center justify-center gap-3 text-red-500 text-lg font-bold py-2">
              <span className="w-4 h-4 rounded-full bg-red-500 animate-ping inline-block" />
              Listening… say the step!
            </div>
          )}

          {/* What you said */}
          {transcript && !isListening && (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-3 text-center">
              <p className="text-sm text-gray-400 font-semibold mb-1">
                You said:
              </p>
              <p className="text-lg text-gray-700 font-bold italic">
                "{transcript}"
              </p>
            </div>
          )}

          {/* Score result */}
          {result && (
            <div
              className={`rounded-2xl p-4 flex items-center gap-4 border-2 ${
                result.score >= 80
                  ? "bg-green-50 border-green-300"
                  : result.score >= 50
                    ? "bg-yellow-50 border-yellow-300"
                    : "bg-red-50 border-red-300"
              }`}
            >
              <ScoreRing score={result.score} />
              <div className="flex-1">
                <p className="text-xl font-extrabold text-gray-800 leading-snug">
                  {result.feedback}
                </p>
                {result.missedWords.length > 0 && (
                  <p className="text-base text-gray-600 mt-1">
                    Try:{" "}
                    <span className="text-red-600 font-bold">
                      {result.missedWords.slice(0, 3).join(", ")}
                    </span>
                  </p>
                )}
                {saving && (
                  <p className="text-sm text-blue-400 mt-1">Saving…</p>
                )}
              </div>
            </div>
          )}

          {/* Try again */}
          {attempts > 0 && (
            <button
              onClick={() => {
                stopListening();
                resetTranscript();
                setResult(null);
              }}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-2xl text-lg transition"
            >
              <RotateCcw size={20} /> Try Again
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SpeechTherapy;
