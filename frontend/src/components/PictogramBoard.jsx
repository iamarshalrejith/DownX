/**
 * PictogramBoard.jsx
 *
 * Shows REAL PHOTOS for every object in a task step.
 *
 * Flow:
 *   stepText → POST /api/picto/extract
 *            → Gemini extracts ["orange", "knife", "cutting board", ...]
 *            → Backend fetches Wikipedia image for each word
 *            → Returns [{ word, imageUrl, wikiTitle }]
 *   Frontend renders actual photos in a tap-to-tick grid
 *
 * Student taps each photo card when they have that item.
 * Card turns green with a big ✓ tick.
 */

import { useState, useEffect, useRef } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;


// ── Smart emoji fallback map ───────────────────────────────────────────────
const WORD_EMOJI_MAP = [
  [/orange|lemon|lime|fruit/i, "🍊"],
  [/apple/i, "🍎"],
  [/banana/i, "🍌"],
  [/grape/i, "🍇"],
  [/strawberr/i, "🍓"],
  [/knife|blade/i, "🔪"],
  [/fork/i, "🍴"],
  [/spoon/i, "🥄"],
  [/cutting board|chopping/i, "🟫"],
  [/juicer/i, "🍹"],
  [/glass|cup|mug/i, "🥛"],
  [/plate|bowl|dish/i, "🍽️"],
  [/pan|pot|wok/i, "🍳"],
  [/soap/i, "🧼"],
  [/hands|hand/i, "🙌"],
  [/water|tap/i, "💧"],
  [/towel/i, "🪣"],
  [/toothbrush/i, "🪥"],
  [/toothpaste/i, "🦷"],
  [/comb|brush/i, "💆"],
  [/shirt|clothes|jacket|coat/i, "👕"],
  [/pants|trouser/i, "👖"],
  [/shoes|boots/i, "👟"],
  [/bag|backpack/i, "🎒"],
  [/book|notebook/i, "📖"],
  [/pencil|pen/i, "✏️"],
  [/paper/i, "📄"],
  [/phone/i, "📱"],
  [/computer|laptop/i, "💻"],
  [/chair/i, "🪑"],
  [/table|desk/i, "🪵"],
  [/door/i, "🚪"],
  [/key/i, "🔑"],
  [/ball/i, "⚽"],
  [/bed/i, "🛏️"],
  [/pillow/i, "🛌"],
  [/milk/i, "🥛"],
  [/egg/i, "🥚"],
  [/bread/i, "🍞"],
  [/rice/i, "🍚"],
  [/vegetable|carrot|onion|tomato/i, "🥦"],
  [/meat|chicken|fish/i, "🍗"],
  [/salt|sugar|pepper/i, "🧂"],
  [/oil/i, "🫙"],
  [/medicine|pill|tablet/i, "💊"],
];

const getWordEmoji = (word = "") => {
  for (const [re, em] of WORD_EMOJI_MAP) {
    if (re.test(word)) return em;
  }
  // Generic fallback by first letter
  const fallbacks = ["⭐","🌟","🎯","💡","🎪","🌈","🎉","🏆","🦋","🌸","🎀","🧩","🎨","🔮","🌻"];
  const idx = word.charCodeAt(0) % fallbacks.length;
  return fallbacks[idx];
};

// ── Single image card ─────────────────────────────────────────────────────
const PictoCard = ({ item, onTick }) => {
  const [ticked,   setTicked]   = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleTap = () => {
    if (ticked) return;
    setTicked(true);
    if (onTick) onTick(item.word);
  };

  return (
    <div
      onClick={handleTap}
      style={{
        width: 130,
        borderRadius: 18,
        overflow: "hidden",
        cursor: ticked ? "default" : "pointer",
        border: ticked ? "4px solid #16A34A" : "4px solid #fff",
        boxShadow: ticked
          ? "0 6px 24px rgba(22,163,74,0.35)"
          : "0 3px 14px rgba(0,0,0,0.14)",
        transform: ticked ? "scale(1.05)" : "scale(1)",
        transition: "all 0.25s ease",
        background: "#f9fafb",
        flexShrink: 0,
        position: "relative",
        userSelect: "none",
      }}
    >
      {/* Image */}
      {item.imageUrl && !imgError ? (
        <img
          src={item.imageUrl}
          alt={item.word}
          onError={() => setImgError(true)}
          style={{
            width: "100%",
            height: 120,
            objectFit: "cover",
            display: "block",
            opacity: ticked ? 0.45 : 1,
            transition: "opacity 0.25s",
          }}
        />
      ) : (
        /* Emoji fallback when no Wikipedia image found */
        <div style={{
          width: "100%", height: 120,
          background: "linear-gradient(135deg, #E0E7FF, #F3F4F6)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <span style={{ fontSize: 56 }}>{getWordEmoji(item.word)}</span>
        </div>
      )}

      {/* Word label */}
      <div style={{
        padding: "8px 6px 9px",
        textAlign: "center",
        fontSize: 14,
        fontWeight: 900,
        color: ticked ? "#16A34A" : "#111827",
        background: ticked ? "#F0FDF4" : "#fff",
        transition: "all 0.25s",
        lineHeight: 1.2,
      }}>
        {item.word}
      </div>

      {/* Green tick overlay */}
      {ticked && (
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -70%)",
          width: 52, height: 52,
          borderRadius: "50%",
          background: "#16A34A",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, color: "#fff", fontWeight: 900,
          boxShadow: "0 4px 16px rgba(22,163,74,0.55)",
        }}>
          ✓
        </div>
      )}
    </div>
  );
};

// ── Skeleton card shown while loading ─────────────────────────────────────
const SkeletonCard = () => (
  <div style={{
    width: 130, borderRadius: 18, overflow: "hidden",
    border: "4px solid #fff",
    boxShadow: "0 3px 14px rgba(0,0,0,0.08)",
    background: "#f9fafb", flexShrink: 0,
  }}>
    <div style={{
      width: "100%", height: 120,
      background: "linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%)",
      backgroundSize: "200% 100%",
      animation: "pictoShimmer 1.4s ease infinite",
    }} />
    <div style={{ padding: "8px 12px 10px" }}>
      <div style={{
        height: 14, borderRadius: 7,
        background: "linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%)",
        backgroundSize: "200% 100%",
        animation: "pictoShimmer 1.4s ease infinite",
      }} />
    </div>
  </div>
);

// ── Main board ─────────────────────────────────────────────────────────────
const PictogramBoard = ({ stepText = "", onAllTicked }) => {
  const [items,   setItems]   = useState([]); // [{ word, imageUrl, wikiTitle }]
  const [loading, setLoading] = useState(false);
  const [ticked,  setTicked]  = useState(new Set());
  const lastFetched = useRef("");

  useEffect(() => {
    if (!stepText?.trim() || stepText === lastFetched.current) return;
    lastFetched.current = stepText;

    setItems([]);
    setTicked(new Set());
    setLoading(true);

    axios.post(`${BASE_URL}/api/picto/extract`, { stepText })
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
    <div style={{ width: "100%" }}>
      {/* Shimmer keyframe */}
      <style>{`
        @keyframes pictoShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        fontSize: 14, fontWeight: 800, color: "#6B7280",
        textTransform: "uppercase", letterSpacing: 1,
        textAlign: "center", marginBottom: 14,
      }}>
        {allDone ? "✅ All items found!" : "👇 Tap each picture when you have it"}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Image cards */}
      {!loading && items.length > 0 && (
        <div style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}>
          {items.map((item, i) => (
            <PictoCard
              key={`${item.word}-${i}`}
              item={item}
              onTick={handleTick}
            />
          ))}
        </div>
      )}

      {/* Progress counter */}
      {!loading && items.length > 0 && (
        <div style={{
          textAlign: "center", marginTop: 12,
          fontSize: 15, fontWeight: 700,
          color: allDone ? "#16A34A" : "#9CA3AF",
          transition: "color 0.3s",
        }}>
          {allDone
            ? "Great! You have everything ready 🎉"
            : `${ticked.size} of ${items.length} found`}
        </div>
      )}
    </div>
  );
};

export default PictogramBoard;