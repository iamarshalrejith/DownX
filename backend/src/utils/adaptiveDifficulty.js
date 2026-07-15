/**
 * adaptiveDifficulty.js
 *
 * Pure logic for adjusting a student's difficultyLevel (1-5) after a
 * task is completed. Level 1 = maximum simplification (very short,
 * single-action steps). Level 5 = minimum simplification (fewer,
 * slightly bundled steps) for students who are ready for more.
 *
 * Deliberately conservative: only ever moves one level at a time, and
 * only when signals clearly agree, so a single unusual attempt can't
 * swing a student's experience.
 */

const MIN_LEVEL = 1;
const MAX_LEVEL = 5;
const DEFAULT_LEVEL = 3;

// A task is "expected" to take this long per step, used as a baseline.
// Kept generous since students may pause, get distracted, etc.
const EXPECTED_MS_PER_STEP = 60 * 1000; // 1 minute per simplified step

function clampLevel(level) {
  return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, level));
}

/**
 * @param {number} currentLevel - student's current difficultyLevel
 * @param {object} signals
 * @param {number} signals.timeTakenMs - time from task start to completion
 * @param {number} signals.stepCount - number of simplified steps in the task
 * @param {number} signals.helpRequests - raised_hand gestures logged for this task attempt
 * @param {number} signals.verificationFailures - failed object-verification attempts for this task attempt
 * @returns {{ newLevel: number, reason: string, expectedTimeMs: number }}
 */
export function computeDifficultyAdjustment(currentLevel, signals) {
  const level = clampLevel(currentLevel || DEFAULT_LEVEL);
  const {
    timeTakenMs = 0,
    stepCount = 1,
    helpRequests = 0,
    verificationFailures = 0,
  } = signals;

  const expectedTimeMs = Math.max(stepCount, 1) * EXPECTED_MS_PER_STEP;
  const struggledOnTime = timeTakenMs > expectedTimeMs * 1.6;
  const wasFast = timeTakenMs > 0 && timeTakenMs < expectedTimeMs * 0.6;
  const neededHelp = helpRequests >= 1;
  const hadFailures = verificationFailures >= 2;

  // Struggling: any two struggle signals agreeing -> make it easier.
  const struggleScore =
    (struggledOnTime ? 1 : 0) + (neededHelp ? 1 : 0) + (hadFailures ? 1 : 0);

  // Thriving: fast AND clean (no help, no failures) -> nudge harder.
  const thriving = wasFast && !neededHelp && !hadFailures;

  if (struggleScore >= 2 && level > MIN_LEVEL) {
    return {
      newLevel: clampLevel(level - 1),
      reason: "struggled_slow_help",
      expectedTimeMs,
    };
  }

  if (thriving && level < MAX_LEVEL) {
    return {
      newLevel: clampLevel(level + 1),
      reason: "fast_clean_completion",
      expectedTimeMs,
    };
  }

  return {
    newLevel: level,
    reason: "no_change",
    expectedTimeMs,
  };
}

export { MIN_LEVEL, MAX_LEVEL, DEFAULT_LEVEL };