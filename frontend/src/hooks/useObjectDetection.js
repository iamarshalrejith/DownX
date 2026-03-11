import { useEffect, useRef, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

/**
 * useObjectDetection
 *
 * Loads COCO-SSD via TensorFlow.js and runs real-time object detection
 * on a video stream.
 *
 * @param {boolean} isEnabled  - master on/off switch
 * @param {number}  intervalMs - how often to run detection (default 800ms)
 *
 * Returns:
 *   videoRef        - attach to <video> element
 *   canvasRef       - attach to <canvas> overlay for bounding boxes
 *   detectedObjects - array of { label, score, bbox: [x,y,w,h] }
 *   isLoading       - model + camera still initialising
 *   error           - string or null
 *   cameraReady     - video stream is live
 */
export const useObjectDetection = (isEnabled = false, intervalMs = 800) => {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const modelRef   = useRef(null);
  const streamRef  = useRef(null);
  const timerRef   = useRef(null);

  const [detectedObjects, setDetectedObjects] = useState([]);
  const [isLoading,       setIsLoading]       = useState(false);
  const [error,           setError]           = useState(null);
  const [cameraReady,     setCameraReady]     = useState(false);

  // ── Draw bounding boxes on canvas overlay ───────────────────────────────
  const drawBoxes = useCallback((predictions) => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach(({ class: label, score, bbox: [x, y, w, h] }) => {
      const pct = Math.round(score * 100);

      // Box
      ctx.strokeStyle = "#6366f1"; // indigo
      ctx.lineWidth   = 2.5;
      ctx.strokeRect(x, y, w, h);

      // Label background
      const text      = `${label} ${pct}%`;
      ctx.font        = "bold 13px Inter, sans-serif";
      const textW     = ctx.measureText(text).width + 10;
      ctx.fillStyle   = "#6366f1";
      ctx.fillRect(x, y - 22, textW, 22);

      // Label text
      ctx.fillStyle = "#ffffff";
      ctx.fillText(text, x + 5, y - 6);
    });
  }, []);

  // ── 1. Load model ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEnabled) return;

    let cancelled = false;

    const loadModel = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("Loading COCO-SSD model...");

        await tf.ready();
        const model = await cocoSsd.load({ base: "mobilenet_v2" });

        if (!cancelled) {
          modelRef.current = model;
          console.log("COCO-SSD model loaded");
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Model load error:", err);
          setError("Failed to load object detection model.");
          setIsLoading(false);
        }
      }
    };

    loadModel();

    return () => {
      cancelled = true;
      modelRef.current = null;
    };
  }, [isEnabled]);

  // ── 2. Start camera (after model ready) ─────────────────────────────────
  useEffect(() => {
    if (!isEnabled || isLoading || !modelRef.current) return;

    let cancelled = false;

    const startCamera = async () => {
      try {
        console.log("Starting camera for object detection...");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "environment" },
        });

        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().then(() => {
              if (!cancelled) {
                console.log("Object detection camera ready");
                setCameraReady(true);
              }
            }).catch(() => {
              if (!cancelled) setError("Could not start video playback.");
            });
          };
        }
      } catch (err) {
        if (cancelled) return;
        if (err.name === "NotAllowedError") setError("Camera permission denied.");
        else if (err.name === "NotFoundError") setError("No camera found.");
        else setError("Could not access camera.");
        console.error("Camera error:", err);
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      clearInterval(timerRef.current);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      setCameraReady(false);
      setDetectedObjects([]);
    };
  }, [isEnabled, isLoading]);

  // ── 3. Detection interval (after camera ready) ───────────────────────────
  useEffect(() => {
    if (!cameraReady || !modelRef.current) return;

    console.log("Object detection loop started");

    timerRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      if (!modelRef.current) return;

      try {
        const predictions = await modelRef.current.detect(videoRef.current);

        // Keep only confident detections (≥ 40%)
        const filtered = predictions
          .filter((p) => p.score >= 0.4)
          .map((p) => ({
            label: p.class,
            score: p.score,
            bbox:  p.bbox,
          }));

        setDetectedObjects(filtered);
        drawBoxes(filtered);
      } catch (err) {
        console.warn("Detection frame error:", err.message);
      }
    }, intervalMs);

    return () => {
      clearInterval(timerRef.current);
      console.log("Object detection loop stopped");
    };
  }, [cameraReady, intervalMs, drawBoxes]);

  return { videoRef, canvasRef, detectedObjects, isLoading, error, cameraReady };
};