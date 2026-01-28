import { useState, useRef, useEffect } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const FaceTest = () => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Initializing...");
  const faceLandmarkerRef = useRef(null);
  const lastDetectionTimeRef = useRef(0);
  const DETECTION_INTERVAL = 1000; // 1 second
  const [faceVectors, setFaceVectors] = useState([]);
  const MAX_SAMPLES = 5;

  // helper function 1
  const landmarksToVector = (landmarks) => {
    const vector = [];

    for (let point of landmarks) {
      vector.push(point.x);
      vector.push(point.y);
      vector.push(point.z);
    }

    return vector;
  };

  // helper function 2
  const normalizeVector = (vector) => {
    const mean = vector.reduce((sum, val) => sum + val, 0) / vector.length;

    const centered = vector.map((v) => v - mean);

    const magnitude = Math.sqrt(
      centered.reduce((sum, val) => sum + val * val, 0),
    );

    return centered.map((v) => v / magnitude);
  };

  // helper function 3
  const averageVectors = (vectors) => {
    const length = vectors[0].length;
    const avg = new Array(length).fill(0);

    for (let vec of vectors) {
      for (let i = 0; i < length; i++) {
        avg[i] += vec[i];
      }
    }

    return avg.map((v) => v / vectors.length);
  };

  // start camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        videoRef.current.srcObject = stream;
        setStatus("Camera started");
      } catch (error) {
        console.log(error);
        setStatus("Camera access Denied");
      }
    }

    startCamera();
  }, []);

  // load Face Landmarker
  useEffect(() => {
    async function loadModel() {
      setStatus("Loading face model...");

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
      );

      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        },
        runningMode: "VIDEO",
        numFaces: 1,
      });

      faceLandmarkerRef.current = faceLandmarker;
      setStatus("Face model loaded");
    }

    loadModel();
  }, []);

  // detect face Landmarks
  useEffect(() => {
    let animationId;

    const detect = async () => {
      if (
        videoRef.current &&
        faceLandmarkerRef.current &&
        videoRef.current.readyState === 4
      ) {
        const now = performance.now();

        // Throttle detection
        if (now - lastDetectionTimeRef.current > DETECTION_INTERVAL) {
          lastDetectionTimeRef.current = now;

          const results = faceLandmarkerRef.current.detectForVideo(
            videoRef.current,
            now,
          );

          if (results.faceLandmarks.length > 0) {
            const landmarks = results.faceLandmarks[0];

            // capture only once
            if (faceVectors.length < MAX_SAMPLES) {
              const rawVector = landmarksToVector(landmarks);
              const normalizedVector = normalizeVector(rawVector);

              setFaceVectors((prev) => {
                const updated = [...prev, normalizedVector];
                console.log(`📸 Sample ${updated.length}/${MAX_SAMPLES}`);
                return updated;
              });
            }
          } else {
            console.log("No face detected");
          }
        }
      }

      animationId = requestAnimationFrame(detect);
    };

    detect();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [status]);

  useEffect(() => {
  if (faceVectors.length === MAX_SAMPLES) {
    const finalVector = averageVectors(faceVectors);
    console.log("Final averaged face vector", finalVector.length);
  }
}, [faceVectors]);


  return (
    <div style={{ padding: "20px" }}>
      <h2>Phase 2 — Day 1: Face Test</h2>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        width="320"
        height="240"
        style={{ borderRadius: "12px", border: "2px solid #ccc" }}
      />

      <p>Status: {status}</p>
    </div>
  );
};

export default FaceTest;
