import { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * PointsBadge
 *
 * Props:
 *   enrollmentId  — student's enrollment ID
 *   refresh       — increment this number to trigger a re-fetch
 */
const PointsBadge = ({ enrollmentId, refresh = 0 }) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnim, setShowAnim] = useState(false);
  const [prevTotal, setPrevTotal] = useState(null);

  useEffect(() => {
    if (!enrollmentId) return;
    setLoading(true);
    axios.get(`${BASE_URL}/api/gamification/student/${enrollmentId}`)
      .then((res) => {
        if (res.data.success) {
          // Animate when points increase
          if (prevTotal !== null && res.data.total > prevTotal) {
            setShowAnim(true);
            setTimeout(() => setShowAnim(false), 1500);
          }
          setPrevTotal(res.data.total);
          setData(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollmentId, refresh]);

  if (loading || !data) {
    return (
      <div className="flex items-center gap-2 bg-yellow-100 border border-yellow-300 rounded-full px-4 py-2">
        <span className="text-yellow-600 text-sm">Loading…</span>
      </div>
    );
  }

  const { total, level, xpInLevel, xpForNext, badge } = data;
  const xpPercent = Math.round((xpInLevel / xpForNext) * 100);

  return (
    <div className={`bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-3 transition-all duration-300 ${
      showAnim ? "scale-110 border-yellow-500 shadow-lg shadow-yellow-200" : ""
    }`}>
      {/* Points + badge row */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{badge.emoji}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold text-orange-700">{total} pts</span>
            <span className="text-xs bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full">
              Level {level}
            </span>
          </div>
          <p className="text-xs text-orange-500 font-semibold">{badge.name}</p>
        </div>
        {showAnim && (
          <span className="text-green-600 font-extrabold text-lg animate-bounce">+pts!</span>
        )}
      </div>

      {/* XP progress bar */}
      <div className="mt-2">
        <div className="flex justify-between text-xs text-orange-400 mb-1">
          <span>{xpInLevel} / {xpForNext} XP to Level {level + 1}</span>
          <span>{xpPercent}%</span>
        </div>
        <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full transition-all duration-700"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default PointsBadge;