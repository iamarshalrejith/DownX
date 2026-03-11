import React, { useState, useEffect, useCallback } from "react";
import { useObjectDetection } from "../../hooks/useObjectDetection";
import { Camera, X, Eye, CheckCircle, AlertCircle, Loader } from "lucide-react";

/**
 * ObjectDetector
 *
 * Floating camera widget on the student dashboard.
 * Shows live bounding boxes and checks detected objects
 * against task verification requirements.
 *
 * Props:
 *   requiredObjects  {string[]}  Labels the task needs verified (e.g. ["cup","bottle"])
 *   taskId           {string}    Current task ID
 *   onVerified       {fn}        Called with (verifiedLabels) when all requirements met
 *   isEnabled        {boolean}   Master switch (default true)
 */
const ObjectDetector = ({
  requiredObjects = [],
  taskId         = null,
  onVerified     = null,
  isEnabled      = true,
}) => {
  const [showCamera,   setShowCamera]   = useState(false);
  const [verifiedSet,  setVerifiedSet]  = useState(new Set());
  const [allVerified,  setAllVerified]  = useState(false);

  const { videoRef, canvasRef, detectedObjects, isLoading, error, cameraReady } =
    useObjectDetection(isEnabled && showCamera);

  // ── Check detections against required objects ────────────────────────────
  useEffect(() => {
    if (!detectedObjects.length || !requiredObjects.length) return;

    const detectedLabels = detectedObjects.map((o) => o.label.toLowerCase());

    setVerifiedSet((prev) => {
      const next = new Set(prev);
      requiredObjects.forEach((req) => {
        if (detectedLabels.includes(req.toLowerCase())) {
          next.add(req.toLowerCase());
        }
      });
      return next;
    });
  }, [detectedObjects, requiredObjects]);

  // ── Fire onVerified when all requirements met ────────────────────────────
  useEffect(() => {
    if (!requiredObjects.length) return;
    const allMet = requiredObjects.every((r) =>
      verifiedSet.has(r.toLowerCase())
    );
    if (allMet && !allVerified) {
      setAllVerified(true);
      console.log("All required objects verified:", [...verifiedSet]);
      onVerified?.([...verifiedSet]);
    }
  }, [verifiedSet, requiredObjects, allVerified, onVerified]);

  // ── Reset when task changes ──────────────────────────────────────────────
  useEffect(() => {
    setVerifiedSet(new Set());
    setAllVerified(false);
  }, [taskId]);

  if (!isEnabled) return null;

  const verifiedCount = requiredObjects.filter((r) =>
    verifiedSet.has(r.toLowerCase())
  ).length;

  return (
    <div className="object-detector">

      {/* ── Toggle Button ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setShowCamera((v) => !v)}
        className={`fixed bottom-20 right-4 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-40 transition-all hover:scale-105 active:scale-95 ${
          allVerified
            ? "bg-green-500 hover:bg-green-600"
            : "bg-purple-500 hover:bg-purple-600"
        }`}
        aria-label="Toggle object detection"
      >
        {allVerified ? <CheckCircle size={20} /> : <Eye size={20} />}
        <span className="font-medium text-sm">
          {allVerified
            ? "Task Verified ✓"
            : showCamera
            ? "Hide Camera"
            : `Check Objects ${requiredObjects.length ? `(${verifiedCount}/${requiredObjects.length})` : ""}`}
        </span>
      </button>

      {/* ── Camera Panel ──────────────────────────────────────────────────── */}
      {showCamera && (
        <div className="fixed bottom-36 right-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-purple-500 w-72">

            {/* Header */}
            <div className="bg-purple-500 text-white px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera size={16} />
                <span className="font-bold text-sm">Object Check</span>
                {cameraReady && !isLoading && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {detectedObjects.length} detected
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowCamera(false)}
                className="hover:text-gray-200 transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Video + Canvas overlay */}
            <div className="relative bg-gray-900">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-72 h-52 object-cover"
                style={{ display: cameraReady ? "block" : "none" }}
              />
              {/* Canvas sits exactly on top of video for bounding boxes */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-72 h-52"
                style={{ display: cameraReady ? "block" : "none" }}
              />

              {/* Loading */}
              {(isLoading || !cameraReady) && !error && (
                <div className="w-72 h-52 bg-gray-800 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Loader size={28} className="animate-spin mx-auto mb-2" />
                    <p className="text-xs">
                      {isLoading ? "Loading AI model…" : "Starting camera…"}
                    </p>
                    {isLoading && (
                      <p className="text-xs text-gray-400 mt-1">
                        First load takes ~5s
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="w-72 h-52 bg-red-500/90 flex items-center justify-center">
                  <div className="text-white text-center px-4">
                    <AlertCircle size={30} className="mx-auto mb-2" />
                    <p className="text-xs font-semibold mb-1">Camera Error</p>
                    <p className="text-xs mb-3">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-white text-red-500 px-3 py-1 rounded text-xs font-semibold"
                    >
                      Reload
                    </button>
                  </div>
                </div>
              )}

              {/* Live badge */}
              {cameraReady && !error && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  Live
                </div>
              )}

              {/* All verified banner */}
              {allVerified && cameraReady && (
                <div className="absolute bottom-0 left-0 right-0 bg-green-500/95 py-2 text-center">
                  <p className="text-white text-xs font-bold">
                    All objects verified!
                  </p>
                </div>
              )}
            </div>

            {/* Live detections list */}
            {cameraReady && detectedObjects.length > 0 && (
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Detected now
                </p>
                <div className="flex flex-wrap gap-1">
                  {detectedObjects.map((obj, i) => (
                    <span
                      key={i}
                      className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium"
                    >
                      {obj.label} {Math.round(obj.score * 100)}%
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Required objects checklist */}
            {requiredObjects.length > 0 && (
              <div className="px-3 py-2 bg-gray-50">
                <p className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Task requires
                </p>
                <div className="space-y-1">
                  {requiredObjects.map((req) => {
                    const verified = verifiedSet.has(req.toLowerCase());
                    return (
                      <div key={req} className="flex items-center gap-2">
                        {verified ? (
                          <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 border-2 border-gray-300 rounded-full flex-shrink-0" />
                        )}
                        <span
                          className={`text-xs capitalize ${
                            verified ? "text-green-600 font-semibold line-through" : "text-gray-600"
                          }`}
                        >
                          {req}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                    <span>Progress</span>
                    <span>{verifiedCount}/{requiredObjects.length}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${requiredObjects.length
                          ? (verifiedCount / requiredObjects.length) * 100
                          : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* No requirements set */}
            {requiredObjects.length === 0 && cameraReady && (
              <div className="px-3 py-3 text-center text-gray-500">
                <Eye size={20} className="mx-auto mb-1 text-gray-400" />
                <p className="text-xs">
                  No required objects set for this task.
                  <br />
                  Showing live detections only.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectDetector;