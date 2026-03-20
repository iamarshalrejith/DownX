/**
 * PictogramBoard.jsx
 *
 * Converts each simplified task step into a visual card with:
 *   - A large emoji/pictogram that represents the action
 *   - The simplified step text in large friendly font
 *   - A "Done!" tick button per step
 *
 * Down syndrome students are visual learners — this replaces the raw text list
 * with a picture-based board.
 *
 * Props:
 *   steps       — string[] — simplifiedSteps from the task
 *   currentStep — current step index
 *   onStepDone  — callback(stepIndex) when student taps Done on a step
 */

import { useState } from "react";
import { FaCheck } from "react-icons/fa";

// Maps keywords in step text to an emoji pictogram
const getPictogram = (text = "") => {
  const t = text.toLowerCase();

  if (/wash|clean|soap|rinse/i.test(t))     return { emoji: "🧼", bg: "bg-blue-100",   border: "border-blue-300" };
  if (/eat|food|meal|breakfast|lunch|dinner|snack/i.test(t)) return { emoji: "🍽️", bg: "bg-yellow-100", border: "border-yellow-300" };
  if (/drink|water|juice|cup|glass/i.test(t)) return { emoji: "🥤", bg: "bg-cyan-100",   border: "border-cyan-300" };
  if (/dress|wear|put on|clothes|shirt|pants|shoe/i.test(t)) return { emoji: "👕", bg: "bg-purple-100", border: "border-purple-300" };
  if (/brush|teeth|tooth/i.test(t))          return { emoji: "🦷", bg: "bg-teal-100",   border: "border-teal-300" };
  if (/walk|go|move|step/i.test(t))          return { emoji: "🚶", bg: "bg-green-100",  border: "border-green-300" };
  if (/sit|chair|table/i.test(t))            return { emoji: "🪑", bg: "bg-orange-100", border: "border-orange-300" };
  if (/book|read|write|draw|paper/i.test(t)) return { emoji: "📚", bg: "bg-indigo-100", border: "border-indigo-300" };
  if (/ball|play|game|run/i.test(t))         return { emoji: "⚽", bg: "bg-lime-100",   border: "border-lime-300" };
  if (/sleep|bed|rest/i.test(t))             return { emoji: "😴", bg: "bg-gray-100",   border: "border-gray-300" };
  if (/hand|wave|hold|pick/i.test(t))        return { emoji: "🤲", bg: "bg-amber-100",  border: "border-amber-300" };
  if (/look|see|watch|eye/i.test(t))         return { emoji: "👀", bg: "bg-sky-100",    border: "border-sky-300" };
  if (/listen|hear|ear/i.test(t))            return { emoji: "👂", bg: "bg-rose-100",   border: "border-rose-300" };
  if (/open|close|door/i.test(t))            return { emoji: "🚪", bg: "bg-stone-100",  border: "border-stone-300" };
  if (/bag|pack|backpack/i.test(t))          return { emoji: "🎒", bg: "bg-violet-100", border: "border-violet-300" };
  if (/pencil|pen|color/i.test(t))           return { emoji: "✏️", bg: "bg-yellow-100", border: "border-yellow-300" };
  if (/phone|call/i.test(t))                 return { emoji: "📱", bg: "bg-blue-100",   border: "border-blue-300" };
  if (/finish|done|complete|end/i.test(t))   return { emoji: "✅", bg: "bg-green-100",  border: "border-green-300" };
  if (/start|begin|first/i.test(t))          return { emoji: "🚀", bg: "bg-indigo-100", border: "border-indigo-300" };

  // Default pictogram based on step number (cycle through friendly icons)
  const defaults = [
    { emoji: "1️⃣", bg: "bg-blue-100",   border: "border-blue-300" },
    { emoji: "2️⃣", bg: "bg-green-100",  border: "border-green-300" },
    { emoji: "3️⃣", bg: "bg-yellow-100", border: "border-yellow-300" },
    { emoji: "4️⃣", bg: "bg-purple-100", border: "border-purple-300" },
    { emoji: "5️⃣", bg: "bg-pink-100",   border: "border-pink-300" },
    { emoji: "6️⃣", bg: "bg-orange-100", border: "border-orange-300" },
  ];
  return defaults[0]; // caller passes index separately
};

const PictogramBoard = ({ steps = [], currentStep = 0, onStepDone }) => {
  const [doneSteps, setDoneSteps] = useState(new Set());

  if (!steps.length) return null;

  const handleDone = (index) => {
    setDoneSteps((prev) => new Set([...prev, index]));
    if (onStepDone) onStepDone(index);
  };

  // Step numbers for default fallback
  const DEFAULT_EMOJIS = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"];

  return (
    <div className="w-full max-w-xl">
      <h3 className="text-center text-lg font-bold text-gray-600 mb-3">
        📋 Task Steps
      </h3>

      <div className="flex flex-col gap-3">
        {steps.map((step, index) => {
          const pic = getPictogram(step);
          const isDone = doneSteps.has(index);
          const isCurrent = index === currentStep;
          const emoji = pic.emoji === "1️⃣" ? (DEFAULT_EMOJIS[index] || "⭐") : pic.emoji;

          return (
            <div
              key={index}
              className={`flex items-center gap-3 rounded-2xl border-2 p-3 transition-all duration-300 ${
                isDone
                  ? "bg-green-50 border-green-400 opacity-70"
                  : isCurrent
                  ? `${pic.bg} ${pic.border} shadow-md scale-[1.02]`
                  : "bg-white border-gray-200"
              }`}
            >
              {/* Pictogram */}
              <div className={`w-14 h-14 flex items-center justify-center rounded-xl text-3xl flex-shrink-0 ${
                isCurrent ? pic.bg : "bg-gray-100"
              }`}>
                {isDone ? "✅" : emoji}
              </div>

              {/* Step text */}
              <p className={`flex-1 text-base font-semibold leading-snug ${
                isDone ? "text-green-700 line-through" : isCurrent ? "text-gray-900" : "text-gray-500"
              }`}>
                {step}
              </p>

              {/* Done button — only on current step */}
              {isCurrent && !isDone && (
                <button
                  onClick={() => handleDone(index)}
                  className="flex-shrink-0 bg-green-500 hover:bg-green-600 text-white rounded-xl px-3 py-2 text-sm font-bold flex items-center gap-1 transition"
                >
                  <FaCheck size={12} /> Done
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PictogramBoard;