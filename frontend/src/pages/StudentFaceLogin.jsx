import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useDispatch } from "react-redux";
import { updateUser } from "../features/auth/authSlice";

const StudentFaceLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const lastDetectionTimeRef = useRef(0);

  const [params] = useSearchParams();
  const enrollmentId = params.get("enrollmentId");
  
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [faceVectors, setFaceVectors] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [retryCount, setRetryCount] = useState(0);

  const DETECTION_INTERVAL = 1000;
  const MAX_SAMPLES = 5;
  const MAX_ATTEMPTS = 3;
  const MIN_ATTEMPTS = 2;
  const MAX_RETRIES = 2;

  // Helpers
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const landmarksToVector = (landmarks) => {
    const vector = [];
    for (let p of landmarks) {
      vector.push(p.x, p.y, p.z);
    }
    return vector;
  };

  const normalizeVector = (vector) => {
    const mean = vector.reduce((s, v) => s + v, 0) / vector.length;
    const centered = vector.map((v) => v - mean);
    const mag = Math.sqrt(centered.reduce((s, v) => s + v * v, 0));
    return centered.map((v) => v / mag);
  };

  const averageVectors = (vectors) => {
    const len = vectors[0].length;
    const avg = new Array(len).fill(0);
    for (let v of vectors) {
      for (let i = 0; i < len; i++) {
        avg[i] += v[i];
      }
    }
    return avg.map((v) => v / vectors.length);
  };

  // Start Camera
  useEffect(() => {
    if (status !== "scanning") return;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
        setError("Could not access camera. Please check permissions.");
        setStatus("error");
        stopCamera();
      }
    }

    startCamera();
  }, [status]);

  // Load Face Model
  useEffect(() => {
    if (status !== "scanning") return;

    async function loadModel() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );

        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          },
          runningMode: "VIDEO",
          numFaces: 1,
        });
      } catch (err) {
        console.error("Model loading error:", err);
        setError("Failed to load face detection. Please refresh.");
        setStatus("error");
        stopCamera();
      }
    }

    loadModel();
  }, [status]);

  // Face Detection Loop
  useEffect(() => {
    if (status !== "scanning") return;

    let rafId;

    const detect = () => {
      if (
        videoRef.current &&
        faceLandmarkerRef.current &&
        videoRef.current.readyState === 4
      ) {
        const now = performance.now();

        if (now - lastDetectionTimeRef.current > DETECTION_INTERVAL) {
          lastDetectionTimeRef.current = now;

          try {
            const res = faceLandmarkerRef.current.detectForVideo(
              videoRef.current,
              now
            );

            if (res.faceLandmarks.length && faceVectors.length < MAX_SAMPLES) {
              const raw = landmarksToVector(res.faceLandmarks[0]);
              const norm = normalizeVector(raw);

              setFaceVectors((prev) => [...prev, norm]);
            }
          } catch (err) {
            console.error("Detection error:", err);
          }
        }
      }

      rafId = requestAnimationFrame(detect);
    };

    detect();
    return () => cancelAnimationFrame(rafId);
  }, [status, faceVectors]);

  // Send to Backend
  useEffect(() => {
    if (faceVectors.length === MAX_SAMPLES) {
      const finalVector = averageVectors(faceVectors);

      setAttempts((prev) => {
        const next = [...prev, finalVector];

        // Verify after minimum attempts
        if (next.length >= MIN_ATTEMPTS && next.length <= MAX_ATTEMPTS) {
          const smoothedVector = averageVectors(next);
          setStatus("verifying");

          axios
            .post(`${import.meta.env.VITE_API_URL}/api/students/face-login`, {
              enrollmentId,
              faceEmbedding: smoothedVector,
            })
            .then((res) => {
              stopCamera();

              // Save token
              localStorage.setItem("studentToken", res.data.token);

              // Update Redux
              dispatch(
                updateUser({
                  ...res.data.student,
                  token: res.data.token,
                  role: "student",
                })
              );

              // Navigate
              navigate("/student-dashboard", { replace: true });
            })
            .catch((err) => {
              console.error("Face login error:", err);
              console.error("Response:", err.response?.data);
              stopCamera();

              const errorMsg = err.response?.data?.message || "Face not recognized";

              // Check if we can retry
              if (retryCount < MAX_RETRIES) {
                setError(`${errorMsg}. Retry ${retryCount + 1}/${MAX_RETRIES}?`);
                setStatus("retry-prompt");
              } else {
                setError(`${errorMsg}. Maximum attempts reached.`);
                setStatus("error");
              }
            });
        } else if (next.length < MAX_ATTEMPTS) {
          // Reset for next attempt
          setFaceVectors([]);
          lastDetectionTimeRef.current = 0;
        }

        return next;
      });
    }
  }, [faceVectors, enrollmentId, navigate, dispatch, retryCount]);

  // Start face login
  const startFaceLogin = () => {
    if (!enrollmentId?.trim()) {
      setError("Enrollment ID is required");
      return;
    }
    setError("");
    setFaceVectors([]);
    setAttempts([]);
    setRetryCount(0);
    setStatus("scanning");
  };

  // Retry handler
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setError("");
    setFaceVectors([]);
    setAttempts([]);
    lastDetectionTimeRef.current = 0;
    setStatus("scanning");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // ===== RENDER =====

  if (status === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl font-medium text-indigo-700">Verifying face…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">
          Student Face Login
        </h2>

        {/* IDLE STATE */}
        {status === "idle" && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Enrollment ID: <span className="font-semibold">{enrollmentId}</span>
            </p>

            <button
              onClick={startFaceLogin}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Start Face Login
            </button>

            <button
              onClick={() => navigate("/student-login")}
              className="w-full mt-3 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition"
            >
              Use Visual PIN Instead
            </button>

            {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}
          </>
        )}

        {/* SCANNING STATE */}
        {status === "scanning" && (
          <div className="flex flex-col items-center justify-center mt-6">
            <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-indigo-500 shadow-xl bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />

              {/* Face guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-40 h-40 rounded-full border-2 border-dashed border-white/70" />
              </div>
            </div>

            <div className="mt-4 space-y-2 text-center">
              <p className="text-sm font-medium text-indigo-700">
                Capturing face… {faceVectors.length}/{MAX_SAMPLES}
              </p>

              <p className="text-xs text-gray-500">
                Hold still • Face the camera • Good lighting
              </p>

              <p className="text-xs text-gray-400">
                Attempt {attempts.length + 1}/{MAX_ATTEMPTS}
              </p>
            </div>
          </div>
        )}

        {/* RETRY PROMPT STATE */}
        {status === "retry-prompt" && (
          <div className="mt-4 space-y-3">
            <p className="text-yellow-600 text-sm font-medium">{error}</p>

            <button
              onClick={handleRetry}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Try Again ({retryCount + 1}/{MAX_RETRIES + 1})
            </button>

            <button
              onClick={() => navigate("/student-login")}
              className="w-full py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition"
            >
              Use Visual PIN Instead
            </button>
          </div>
        )}

        {/* ERROR STATE */}
        {status === "error" && (
          <div className="mt-4 space-y-3">
            <p className="text-red-500 text-sm font-medium">{error}</p>

            <button
              onClick={() => navigate("/student-login")}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Use Visual PIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFaceLogin;