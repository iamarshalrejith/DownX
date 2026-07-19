/**
 * PictogramBoard.jsx
 *
 * The primary visual teaching aid for a step. Shows REAL PHOTOS for
 * every concrete thing named in the step — or, for single letters/
 * numbers, a large styled letter tile instead of a (meaningless)
 * photo of the character itself.
 *
 * Flow:
 *   stepText → POST /api/picto/extract
 *            → Gemini extracts concrete items ["apple", "A", ...]
 *            → Backend fetches a Wikipedia photo for real-world items,
 *              and flags single letters/numbers as isLetterOrNumber
 *   Frontend renders large tap-to-tick cards: photo, or big letter tile.
 *
 * Student taps each card once they've seen/found/understood it.
 */

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FiCheck, FiImage } from "react-icons/fi";

const BASE_URL = import.meta.env.VITE_API_URL;

// ── Single card: photo, letter tile, or plain-word placeholder ────────────
const PictoCard = ({ item, onTick }) => {
  const [ticked, setTicked] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleTap = () => {
    if (ticked) return;
    setTicked(true);
    if (onTick) onTick(item.word);
  };

  return (
    <button
      type="button"
      onClick={handleTap}
      aria-pressed={ticked}
      aria-label={`${item.word}${ticked ? ", done" : ""}`}
      className={`relative flex-shrink-0 w-36 rounded-3xl overflow-hidden text-left transition-transform duration-200 focus-visible:outline focus-visible:outline-3 ${
        ticked ? "scale-105" : "scale-100"
      }`}
      style={{
        border: ticked ? "4px solid var(--color-success)" : "4px solid var(--color-surface)",
        boxShadow: ticked
          ? "0 6px 24px rgba(76,140,91,0.35)"
          : "0 3px 14px rgba(0,0,0,0.12)",
        cursor: ticked ? "default" : "pointer",
      }}
    >
      {/* Letter / number tile */}
      {item.isLetterOrNumber ? (
        <div className="w-full h-32 bg-brand-light flex items-center justify-center">
          <span className="text-6xl font-extrabold text-brand">{item.word}</span>
        </div>
      ) : item.imageUrl && !imgError ? (
        <img
          src={item.imageUrl}
          alt={item.word}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => {
            console.error("PictogramBoard: image failed to load ->", item.imageUrl);
            setImgError(true);
          }}
          className="w-full h-32 object-cover block"
          style={{ opacity: ticked ? 0.45 : 1, transition: "opacity 0.25s" }}
        />
      ) : (
        <div className="w-full h-32 bg-bg flex flex-col items-center justify-center gap-2">
          <FiImage size={32} className="text-ink-soft" />
        </div>
      )}

      {/* Word label */}
      <div
        className={`px-2 py-2 text-center text-sm font-extrabold leading-tight ${
          ticked ? "bg-success-light text-success" : "bg-surface text-ink"
        }`}
      >
        {item.word}
      </div>

      {/* Tick overlay */}
      {ticked && (
        <div
          className="absolute rounded-full bg-success flex items-center justify-center text-white"
          style={{
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 48,
            height: 48,
            boxShadow: "0 4px 16px rgba(76,140,91,0.55)",
          }}
        >
          <FiCheck size={26} />
        </div>
      )}
    </button>
  );
};

// ── Skeleton card shown while loading ──────────────────────────────────────
const SkeletonCard = () => (
  <div
    className="flex-shrink-0 w-36 rounded-3xl overflow-hidden bg-surface"
    style={{ border: "4px solid var(--color-surface)", boxShadow: "0 3px 14px rgba(0,0,0,0.08)" }}
  >
    <div className="w-full h-32 pictoShimmer" />
    <div className="px-3 py-2.5">
      <div className="h-3.5 rounded-full pictoShimmer" />
    </div>
  </div>
);

// ── Main board ───────────────────────────────────────────────────────────
const PictogramBoard = ({ stepText = "", onAllTicked }) => {
  const [items, setItems] = useState([]); // [{ word, imageUrl, wikiTitle, isLetterOrNumber }]
  const [loading, setLoading] = useState(false);
  const [ticked, setTicked] = useState(new Set());
  const lastFetched = useRef("");

  useEffect(() => {
    if (!stepText?.trim() || stepText === lastFetched.current) return;
    lastFetched.current = stepText;

    setItems([]);
    setTicked(new Set());
    setLoading(true);

    axios
      .post(`${BASE_URL}/api/picto/extract`, { stepText })
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.items)) {
          setItems(res.data.items);
        }
      })
      .catch((err) => {
        console.error("Picto fetch failed:", err.message);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [stepText]);

  const handleTick = (word) => {
    setTicked((prev) => {
      const next = new Set([...prev, word]);
      if (onAllTicked && next.size >= items.length && items.length > 0) {
        setTimeout(onAllTicked, 400); // slight delay for animation
      }
      return next;
    });
  };

  // Don't show anything if no step text or no items and not loading
  if (!stepText?.trim()) return null;
  if (!loading && items.length === 0) return null;

  const allDone = ticked.size >= items.length && items.length > 0;

  return (
    <div className="w-full">
      <style>{`
        @keyframes pictoShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .pictoShimmer {
          background: linear-gradient(90deg, var(--color-border) 25%, var(--color-bg) 50%, var(--color-border) 75%);
          background-size: 200% 100%;
          animation: pictoShimmer 1.4s ease infinite;
        }
      `}</style>

      {/* Header */}
      <div className="text-sm font-bold text-ink-soft uppercase tracking-wide text-center mb-3">
        {allDone ? "All pictures done" : "Tap each picture"}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="flex gap-3 justify-center flex-wrap">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Image cards */}
      {!loading && items.length > 0 && (
        <div className="flex gap-3 justify-center flex-wrap">
          {items.map((item, i) => (
            <PictoCard key={`${item.word}-${i}`} item={item} onTick={handleTick} />
          ))}
        </div>
      )}

      {/* Progress counter */}
      {!loading && items.length > 0 && (
        <div
          className={`text-center mt-3 text-sm font-bold transition-colors ${
            allDone ? "text-success" : "text-ink-soft"
          }`}
        >
          {allDone ? "Great! You found everything." : `${ticked.size} of ${items.length} found`}
        </div>
      )}
    </div>
  );
};

export default PictogramBoard;