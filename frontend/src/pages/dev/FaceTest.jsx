import { useState, useRef, useEffect } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const FaceTest = () => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Initializing...");
  const faceLandmarkerRef = useRef(null);

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
        const results = faceLandmarkerRef.current.detectForVideo(
          videoRef.current,
          performance.now(),
        );

        if (results.faceLandmarks.length > 0) {
          console.log("Face landmarks:", results.faceLandmarks[0]);
        }
      }

      animationId = requestAnimationFrame(detect);
    };

    detect();

    return () => cancelAnimationFrame(animationId);
  }, []);

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
