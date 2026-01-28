import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const StudentFaceLogin = () => {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const lastDetectionTimeRef = useRef(0);

  const [enrollmentId, setEnrollmentId] = useState("");
  const [status, setStatus] = useState("idle"); 
  const [error, setError] = useState("");
  const [faceVectors, setFaceVectors] = useState([]);

  const DETECTION_INTERVAL = 1000;
  const MAX_SAMPLES = 5;

  /* ------------------ Helpers (same as enrollment) ------------------ */

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

  /* ------------------ Start Camera ------------------ */

  useEffect(() => {
    if (status !== "scanning") return;

    async function startCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    }

    startCamera();
  }, [status]);

  /* ------------------ Load Face Model ------------------ */

  useEffect(() => {
    if (status !== "scanning") return;

    async function loadModel() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );

      faceLandmarkerRef.current =
        await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          },
          runningMode: "VIDEO",
          numFaces: 1,
        });
    }

    loadModel();
  }, [status]);

  /* ------------------ Face Detection Loop ------------------ */

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
            now
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

  /* ------------------ Send to Backend ------------------ */

  useEffect(() => {
    if (faceVectors.length === MAX_SAMPLES) {
      const finalVector = averageVectors(faceVectors);
      setStatus("verifying");

      axios
        .post("/api/students/face-login", {
          enrollmentId,
          faceEmbedding: finalVector,
        })
        .then((res) => {
          localStorage.setItem("studentToken", res.data.token);
          navigate("/student-dashboard");
        })
        .catch(() => {
          setError("Face not recognized. Please try Visual PIN.");
          setStatus("error");
        });
    }
  }, [faceVectors, enrollmentId, navigate]);

  /* ------------------ UI ------------------ */

  const startFaceLogin = () => {
    if (!enrollmentId.trim()) {
      setError("Enrollment ID is required");
      return;
    }
    setError("");
    setFaceVectors([]);
    setStatus("scanning");
  };

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
    <div style={{ padding: 20 }}>
      <h2>Student Face Login</h2>

      {status === "idle" && (
        <>
          <input
            type="text"
            placeholder="Enrollment ID"
            value={enrollmentId}
            onChange={(e) => setEnrollmentId(e.target.value)}
          />
          <br /><br />
          <button onClick={startFaceLogin}>Start Face Login</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </>
      )}

      {status === "scanning" && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            width={320}
            height={240}
            style={{ borderRadius: 12, border: "2px solid #ccc" }}
          />
          <p>
            Capturing face… {faceVectors.length}/{MAX_SAMPLES}
          </p>
        </>
      )}
    </div>
  );
};

export default StudentFaceLogin;
