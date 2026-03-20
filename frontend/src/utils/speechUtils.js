// Levenshtein edit distance
const levenshtein = (a, b) => {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
};

const normalise = (str) =>
  str.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

const tokenise = (str) =>
  normalise(str).split(/\s+/).filter(Boolean);

// Fuzzy match — allows 1 edit per 4 chars (tolerant for Down syndrome)
const isFuzzyMatch = (spoken, expected) => {
  if (spoken === expected) return true;
  const threshold = Math.max(1, Math.floor(expected.length / 4));
  return levenshtein(spoken, expected) <= threshold;
};

/**
 * scorePronunciation(spoken, expected)
 * Returns { score 0-100, feedback, matchedWords, missedWords }
 */
export const scorePronunciation = (spoken, expected) => {
  if (!expected?.trim()) return { score: 0, feedback: "No text to score", matchedWords: [], missedWords: [] };
  if (!spoken?.trim())   return { score: 0, feedback: "Nothing heard — try again! 🎤", matchedWords: [], missedWords: tokenise(expected) };

  const spokenWords   = tokenise(spoken);
  const expectedWords = tokenise(expected);
  const matchedWords  = [];
  const missedWords   = [];
  const used = new Set();

  for (const exp of expectedWords) {
    let found = false;
    for (let i = 0; i < spokenWords.length; i++) {
      if (!used.has(i) && isFuzzyMatch(spokenWords[i], exp)) {
        matchedWords.push(exp);
        used.add(i);
        found = true;
        break;
      }
    }
    if (!found) missedWords.push(exp);
  }

  const score = Math.round((matchedWords.length / expectedWords.length) * 100);

  let feedback;
  if (score >= 90)      feedback = "Amazing! 🌟 Perfect pronunciation!";
  else if (score >= 70) feedback = "Great job! 👍 Almost perfect!";
  else if (score >= 50) feedback = `Keep going! 💪 Try: ${missedWords.slice(0, 3).join(", ")}`;
  else                  feedback = `Try again! 🔄 Focus on: ${missedWords.slice(0, 3).join(", ")}`;

  return { score, feedback, matchedWords, missedWords };
};

/**
 * speakText — TTS helper, reads text aloud slowly (good for Down syndrome)
 */
export const speakText = (text, { rate = 0.8, pitch = 1.0 } = {}) => {
  if (!window.speechSynthesis || !text?.trim()) return;
  window.speechSynthesis.cancel();
  const u  = new SpeechSynthesisUtterance(text);
  u.rate   = rate;
  u.pitch  = pitch;
  u.lang   = "en-US";
  window.speechSynthesis.speak(u);
};