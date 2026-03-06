import { useEffect, useRef, useState } from "react";
import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision";

/**
 * Maps MediaPipe gesture category names to DownX gesture types.
 * Returns null for gestures we don't care about.
 */
const mapGestureName = (mpGesture) => {
  const mapping = {
    Open_Palm:  "raised_hand",
    Thumb_Up:   "thumbs_up",
    Thumb_Down: "thumbs_down",
    Victory:    "peace_sign",
    ILoveYou:   "peace_sign",
  };
  return mapping[mpGesture] || null;
};

/**
 * useGestureDetection
 *
 * Loads the MediaPipe GestureRecognizer model, opens the camera,
 * and runs a detection loop. Returns real-time gesture + confidence.
 *
 * @param {boolean} isEnabled - start/stop the whole pipeline
 */
export const useGestureDetection = (isEnabled = false) => {
  const videoRef              = useRef(null);
  const gestureRecognizerRef  = useRef(null);
  const streamRef             = useRef(null);
  const detectionLoopRef      = useRef(null);

  const [currentGesture, setCurrentGesture] = useState(null);
  const [confidence,      setConfidence]      = useState(0);
  const [isLoading,       setIsLoading]       = useState(false);
  const [error,           setError]           = useState(null);
  const [cameraReady,     setCameraReady]     = useState(false);

  // ── 1. Load Model ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEnabled) return;

    let cancelled = false;

    const initModel = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("Loading gesture recognizer...");

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.3,
          minHandPresenceConfidence:  0.3,
          minTrackingConfidence:      0.3,
        });

        if (!cancelled) {
          gestureRecognizerRef.current = recognizer;
          console.log("Gesture recognizer loaded");
          setIsLoading(false);
        } else {
          recognizer.close();
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Model init error:", err);
          setError("Failed to load gesture model. Check your internet connection.");
          setIsLoading(false);
        }
      }
    };

    initModel();

    return () => {
      cancelled = true;
      if (gestureRecognizerRef.current) {
        gestureRecognizerRef.current.close();
        gestureRecognizerRef.current = null;
        console.log("Gesture recognizer closed");
      }
    };
  }, [isEnabled]);

  // ── 2. Start Camera (after model is ready) ──────────────────────────────────
  useEffect(() => {
    if (!isEnabled || isLoading || !gestureRecognizerRef.current) return;

    let cancelled = false;

    const startCamera = async () => {
      try {
        console.log("Starting camera...");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current
              .play()
              .then(() => {
                if (!cancelled) {
                  console.log("Camera started");
                  setCameraReady(true);
                }
              })
              .catch((err) => {
                if (!cancelled) setError("Could not start video playback.");
              });
          };
        }
      } catch (err) {
        if (cancelled) return;
        if (err.name === "NotAllowedError") {
          setError("Camera permission denied. Please allow camera access.");
        } else if (err.name === "NotFoundError") {
          setError("No camera found on this device.");
        } else {
          setError("Could not access camera.");
        }
        console.error("Camera error:", err);
      }
    };

    startCamera();

    return () => {
      cancelled = true;

      if (detectionLoopRef.current) {
        cancelAnimationFrame(detectionLoopRef.current);
        detectionLoopRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        console.log("Camera stopped");
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraReady(false);
      setCurrentGesture(null);
      setConfidence(0);
    };
  }, [isEnabled, isLoading]);

  // ── 3. Detection Loop (after camera is ready) ───────────────────────────────
  useEffect(() => {
    if (!cameraReady || !gestureRecognizerRef.current) return;

    console.log("Detection loop started");

    const detect = () => {
      if (
        gestureRecognizerRef.current &&
        videoRef.current &&
        videoRef.current.readyState >= 2
      ) {
        try {
          const result = gestureRecognizerRef.current.recognizeForVideo(
            videoRef.current,
            performance.now()
          );

          if (result.gestures.length > 0) {
            const top    = result.gestures[0][0];
            const mapped = mapGestureName(top.categoryName);

            if (mapped) {
              setCurrentGesture(mapped);
              setConfidence(top.score);
            } else {
              setCurrentGesture(null);
              setConfidence(0);
            }
          } else {
            setCurrentGesture(null);
            setConfidence(0);
          }
        } catch (err) {
          // Detection errors are non-fatal; just log and continue
          console.warn("Detection frame error:", err.message);
        }
      }

      detectionLoopRef.current = requestAnimationFrame(detect);
    };

    detect();

    return () => {
      if (detectionLoopRef.current) {
        cancelAnimationFrame(detectionLoopRef.current);
        console.log("Detection loop stopped");
      }
    };
  }, [cameraReady]);

  return { videoRef, currentGesture, confidence, isLoading, error, cameraReady };
};