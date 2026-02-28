import { useEffect, useRef, useState } from "react";
import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision";

export const useGestureDetection = (isEnabled = false) => {
  const videoRef = useRef(null);
  const gestureRecognizerRef = useRef(null);
  const streamRef = useRef(null);
  const detectionLoopRef = useRef(null);

  const [currentGesture, setCurrentGesture] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Load MediaPipe Gesture Recognizer (FIRST)
  useEffect(() => {
    if (!isEnabled) return;

    const initGestureRecognizer = async () => {
      try {
        setIsLoading(true);
        console.log("Loading gesture recognizer...");

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );

        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        gestureRecognizerRef.current = recognizer;
        console.log("Gesture recognizer loaded!");
        setIsLoading(false);
        console.log("Debug info:", {
          isEnabled,
          isLoading,
          hasRecognizer: !!gestureRecognizerRef.current,
          cameraReady,
          hasVideoRef: !!videoRef.current,
        });
      } catch (err) {
        console.error("Gesture recognizer init error:", err);
        setError("Failed to load gesture recognition");
        setIsLoading(false);
      }
    };

    initGestureRecognizer();

    return () => {
      if (gestureRecognizerRef.current) {
        gestureRecognizerRef.current.close();
        console.log("Gesture recognizer closed");
      }
    };
  }, [isEnabled]);

  // Start Camera (AFTER model is loaded)
  useEffect(() => {
    if (!isEnabled) return;
    if (isLoading) return; // Wait for model to load
    if (!gestureRecognizerRef.current) return; // Model must be ready

    const startCamera = async () => {
      try {
        console.log("Starting camera...");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            videoRef.current
              .play()
              .then(() => {
                console.log("Camera started successfully!");
                setCameraReady(true);
              })
              .catch((err) => {
                console.error("Video play error:", err);
                setError("Could not start video playback");
              });
          };
        }
      } catch (err) {
        console.error("Camera error:", err);

        if (err.name === "NotAllowedError") {
          setError("Camera access denied. Please allow camera permissions.");
        } else if (err.name === "NotFoundError") {
          setError("No camera found on this device.");
        } else {
          setError("Could not access camera.");
        }
      }
    };

    startCamera();

    // Cleanup camera on unmount
    return () => {
      if (detectionLoopRef.current) {
        cancelAnimationFrame(detectionLoopRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        console.log("Camera stopped");
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setCameraReady(false);
    };
  }, [isEnabled, isLoading]); // Re-run when isLoading changes

  // Gesture Detection Loop (AFTER camera is ready)
  useEffect(() => {
    if (!cameraReady) return;
    if (!gestureRecognizerRef.current) return;

    console.log("Starting gesture detection loop...");

    const detect = () => {
      if (
        !gestureRecognizerRef.current ||
        !videoRef.current ||
        videoRef.current.readyState < 2
      ) {
        detectionLoopRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        const result = gestureRecognizerRef.current.recognizeForVideo(
          videoRef.current,
          performance.now(),
        );

        if (result.gestures.length > 0) {
          const gesture = result.gestures[0][0];
          const mapped = mapGestureName(gesture.categoryName);

          if (mapped) {
            setCurrentGesture(mapped);
            setConfidence(gesture.score);
            console.log(
              `Detected: ${mapped} (${(gesture.score * 100).toFixed(0)}%)`,
            );
          } else {
            setCurrentGesture(null);
            setConfidence(0);
          }
        } else {
          setCurrentGesture(null);
          setConfidence(0);
        }
      } catch (err) {
        console.error("Detection error:", err);
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

  // Gesture Mapping
  const mapGestureName = (mpGesture) => {
    const mapping = {
      Open_Palm: "raised_hand",
      Thumb_Up: "thumbs_up",
      Thumb_Down: "thumbs_down",
      Victory: "peace_sign",
      ILoveYou: "peace_sign",
    };

    return mapping[mpGesture] || null;
  };

  return {
    videoRef,
    currentGesture,
    confidence,
    isLoading,
    error,
    cameraReady,
  };
};
