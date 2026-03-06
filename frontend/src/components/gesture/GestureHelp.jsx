import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { AlertCircle, Hand, CheckCircle, X, RefreshCw } from "lucide-react";

const POLL_INTERVAL_MS = 10_000; // 10 seconds

const GestureHelp = () => {
  const [helpRequests, setHelpRequests] = useState([]);
  const [isLoading,    setIsLoading]    = useState(false);
  const [showPanel,    setShowPanel]    = useState(false);
  const [autoRefresh,  setAutoRefresh]  = useState(true);
  const [lastUpdated,  setLastUpdated]  = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchHelpRequests = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);

      const token = localStorage.getItem("token");
      if (!token) return;

      const { data } = await axios.get("/api/gestures/help-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setHelpRequests(data.helpRequests || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("fetchHelpRequests:", err);
      if (!silent && showPanel) {
        toast.error("Could not fetch help requests.");
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [showPanel]);

  // ── Auto-poll when panel is open ───────────────────────────────────────────
  useEffect(() => {
    if (!showPanel) return;

    fetchHelpRequests(); // immediate fetch on open

    if (!autoRefresh) return;

    const interval = setInterval(() => fetchHelpRequests(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [showPanel, autoRefresh, fetchHelpRequests]);

  // ── Background badge poll (even when panel is closed) ─────────────────────
  useEffect(() => {
    const bg = setInterval(() => fetchHelpRequests(true), POLL_INTERVAL_MS);
    return () => clearInterval(bg);
  }, [fetchHelpRequests]);

  // ── Resolve ────────────────────────────────────────────────────────────────
  const resolveRequest = async (gestureId, studentName) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `/api/gestures/${gestureId}/resolve`,
        { responseNote: "Teacher acknowledged and helped" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Optimistic update
      setHelpRequests((prev) => prev.filter((r) => r._id !== gestureId));
      toast.success(`Helped ${studentName}!`, { icon: "👨‍🏫" });
    } catch (err) {
      console.error("resolveRequest:", err);
      toast.error("Could not resolve request. Please try again.");
      fetchHelpRequests(); // re-sync
    }
  };

  const unreadCount = helpRequests.length;

  return (
    <>
      {/* ── Floating Badge Button ───────────────────────────────────────── */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setShowPanel((v) => !v)}
          className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg relative transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label="Help Requests"
        >
          <AlertCircle size={28} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-900 font-bold text-xs min-w-[22px] h-[22px] rounded-full flex items-center justify-center animate-pulse px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Panel ────────────────────────────────────────────────────────── */}
      {showPanel && (
        <div
          className="fixed bottom-20 left-4 w-96 bg-white rounded-xl shadow-2xl border-2 border-red-500 overflow-hidden z-50"
          style={{ maxHeight: "28rem", animation: "slideUp 0.2s ease-out" }}
        >
          {/* Header */}
          <div className="bg-red-500 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <h3 className="font-bold">Help Requests</h3>
              {unreadCount > 0 && (
                <span className="bg-white text-red-500 text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh((v) => !v)}
                className={`p-1 rounded transition ${autoRefresh ? "bg-white/20" : "bg-white/10"}`}
                title={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
              >
                <RefreshCw size={15} className={autoRefresh ? "animate-spin-slow" : ""} />
              </button>
              <button
                onClick={() => setShowPanel(false)}
                className="hover:text-gray-200 transition"
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto" style={{ maxHeight: "20rem" }}>
            {isLoading && helpRequests.length === 0 ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Loading…</p>
              </div>
            ) : helpRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle size={40} className="mx-auto text-green-500 mb-2" />
                <p className="font-semibold">No pending help requests</p>
                <p className="text-sm mt-1">All students are doing great! 🎉</p>
              </div>
            ) : (
              <div className="divide-y">
                {helpRequests.map((req) => {
                  const studentName =
                    req.studentId?.name || "Unknown Student";

                  return (
                    <div
                      key={req._id}
                      className="p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Hand size={18} className="text-red-500 flex-shrink-0" />
                            <p className="font-bold text-gray-800 truncate">
                              {studentName}
                            </p>
                          </div>

                          <p className="text-xs text-gray-500 mb-1">
                            ID: {req.studentId?.enrollmentId || req.enrollmentId}
                          </p>

                          {req.taskId && (
                            <p className="text-sm text-gray-600 mb-1 truncate">
                              {req.taskId.title}
                            </p>
                          )}

                          <p className="text-xs text-gray-400">
                            {new Date(req.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" · "}
                            {new Date(req.createdAt).toLocaleDateString()}
                          </p>

                          {req.confidence != null && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Confidence: {(req.confidence * 100).toFixed(0)}%
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => resolveRequest(req._id, studentName)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition flex-shrink-0 hover:scale-105 active:scale-95"
                        >
                          ✓ Helped
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t px-4 py-2 flex items-center justify-between">
            <button
              onClick={() => fetchHelpRequests()}
              disabled={isLoading}
              className="text-sm text-blue-500 hover:text-blue-600 font-medium disabled:opacity-50 flex items-center gap-1"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
              {isLoading ? "Refreshing…" : "Refresh"}
            </button>

            {lastUpdated && (
              <span className="text-xs text-gray-400">
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spinSlow 3s linear infinite; }
      `}</style>
    </>
  );
};

export default GestureHelp;