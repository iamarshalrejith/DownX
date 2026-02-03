import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const StudentFaceLogin = () => {
  const navigate = useNavigate();

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

  const DETECTION_INTERVAL = 1000;
  const MAX_SAMPLES = 5;

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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
    }

    startCamera();
  }, [status]);

  // Load Face Model 

  useEffect(() => {
    if (status !== "scanning") return;

    async function loadModel() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
      );

      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          },
          runningMode: "VIDEO",
          numFaces: 1,
        },
      );
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

          const res = faceLandmarkerRef.current.detectForVideo(
            videoRef.current,
            now,
          );

          if (res.faceLandmarks.length && faceVectors.length < MAX_SAMPLES) {
            const raw = landmarksToVector(res.faceLandmarks[0]);
            const norm = normalizeVector(raw);

            setFaceVectors((prev) => {
              const next = [...prev, norm];
              return next;
            });
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

        // Only verify after 2 attempts
        if (next.length === 2) {
          const smoothedVector = averageVectors(next);
          setStatus("verifying");

          axios
            .post("/api/students/face-login", {
              enrollmentId,
              faceEmbedding: smoothedVector,
            })
            .then((res) => {
              //
              if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
              }

              localStorage.setItem("studentToken", res.data.token);
              navigate("/student-dashboard");
            })

            .catch(() => {
              stopCamera();
              setError(
                "Face not recognized. Please try again or use Visual PIN.",
              );
              setStatus("error");
            });
        } else {
          // reset for next attempt
          setFaceVectors([]);
          lastDetectionTimeRef.current = 0;
        }

        return next;
      });
    }
  }, [faceVectors, enrollmentId, navigate]);

  // UI

  const startFaceLogin = () => {
    if (!enrollmentId.trim()) {
      setError("Enrollment ID is required");
      return;
    }
    setError("");
    setFaceVectors([]);
    setStatus("scanning");
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  if (status === "verifying") {
    return <p>Verifying face…</p>;
  }

  if (status === "error") {
    return (
      <div>
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={() => navigate("/student-login")}>
          Use Visual PIN
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">
          Student Face Login
        </h2>

        {status === "idle" && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Enrollment ID:{" "}
              <span className="font-semibold">{enrollmentId}</span>
            </p>

            <button
              onClick={startFaceLogin}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Start Face Login
            </button>

            {error && <p className="text-red-500 mt-3">{error}</p>}
          </>
        )}

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

            <p className="mt-4 text-sm font-medium text-indigo-700">
              Capturing face… {faceVectors.length}/{MAX_SAMPLES}
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Hold still • Face the camera • Good lighting
            </p>

            <p className="text-xs text-gray-400 mt-1">
              Attempt {attempts.length + 1}/2
            </p>
          </div>
        )}

        {status === "verifying" && (
          <p className="text-indigo-700 font-medium mt-6">Verifying face…</p>
        )}

        {status === "error" && (
          <div className="mt-4">
            <p className="text-red-500 mb-3">{error}</p>
            <button
              onClick={() => navigate("/student-login")}
              className="text-indigo-600 underline"
            >
              Use Visual PIN instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFaceLogin;
