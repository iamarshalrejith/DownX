import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const FaceEnrollPage = () => {
  const [params] = useSearchParams();
  const token = params.get("token");

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
      await axios.get(
        `/api/students/face-enroll/validate?token=${token}`
      );
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
    videoRef.current.srcObject = stream;
  }

  startCamera();
}, [status]);


useEffect(() => {
  if (status !== "ready") return;

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
          now
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
    console.log("Enrollment vector ready", finalVector.length);
  }
}, [faceVectors]);

if (status === "validating") return <p>Validating enrollment link…</p>;
if (status === "invalid") return <p>Enrollment link invalid or expired.</p>;

return (
  <div style={{ padding: 20 }}>
    <h2>Face Enrollment</h2>
    <video ref={videoRef} autoPlay playsInline muted width={320} />
    <p>Capturing face samples… {faceVectors.length}/{MAX_SAMPLES}</p>
  </div>
);
};

export default FaceEnrollPage;
