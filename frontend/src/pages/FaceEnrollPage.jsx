import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const FaceEnrollPage = () => {
  const [params] = useSearchParams();
  const token = params.get("token");

  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const lastDetectionTimeRef = useRef(0);

  const [status, setStatus] = useState("validating");
  const [faceVectors, setFaceVectors] = useState([]);

  const DETECTION_INTERVAL = 1000;
  const MAX_SAMPLES = 5;

  // helper functions (COPY from FaceTest.jsx)
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
      for (let i = 0; i < len; i++) avg[i] += v[i];
    }
    return avg.map((v) => v / vectors.length);
  };

  useEffect(() => {
    async function validateToken() {
      try {
        await axios.get(`/api/students/face-enroll/validate?token=${token}`);
        setStatus("ready");
      } catch {
        setStatus("invalid");
      }
    }

    if (token) validateToken();
    else setStatus("invalid");
  }, [token]);

  useEffect(() => {
    if (status !== "ready") return;

    async function startCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
streamRef.current = stream;
videoRef.current.srcObject = stream;

    }

    startCamera();
  }, [status]);

  useEffect(() => {
    if (status !== "ready") return;

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

  useEffect(() => {
    if (status !== "ready") return;

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
              console.log(`📸 ${next.length}/${MAX_SAMPLES}`);
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

  useEffect(() => {
  if (faceVectors.length === MAX_SAMPLES) {
    const finalVector = averageVectors(faceVectors);
    axios
      .post("/api/students/face-enroll/complete", {
        token,
        faceEmbedding: finalVector,
      })
      .then(() => {
        // STOP CAMERA HERE
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        setStatus("completed");
      })
      .catch(() => {
        setStatus("error");
      });
  }
}, [faceVectors]);

useEffect(() => {
  return () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
}, []);



  if (status === "validating") return <p>Validating enrollment link…</p>;
  if (status === "invalid") return <p>Enrollment link invalid or expired.</p>;
  if (status === "completed")
    return <p>Face enrollment completed successfully.</p>;

  if (status === "error")
    return <p>Enrollment failed. Please contact teacher.</p>;

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100">
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
      <h2 className="text-2xl font-bold text-indigo-700 mb-4">
        Face Enrollment
      </h2>

      {/* Camera */}
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
          Capturing face samples… {faceVectors.length}/{MAX_SAMPLES}
        </p>

        <p className="text-xs text-gray-500 mt-1">
          Hold still • Face the camera • Good lighting
        </p>
      </div>
    </div>
  </div>
);

};

export default FaceEnrollPage;
