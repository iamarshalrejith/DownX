import { useEffect, useRef, useState } from 'react';
import { GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision';

export const useGestureDetection = (isEnabled = false) => {
  const videoRef = useRef(null);
  const gestureRecognizerRef = useRef(null);
  const streamRef = useRef(null);
  const detectionLoopRef = useRef(null);

  const [currentGesture, setCurrentGesture] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize MediaPipe Gesture Recognizer
  useEffect(() => {
    if (!isEnabled) return;

    const initGestureRecognizer = async () => {
      try {
        setIsLoading(true);
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        gestureRecognizerRef.current = recognizer;
        setIsLoading(false);
      } catch (err) {
        console.error('Gesture recognizer init error:', err);
        setError('Failed to load gesture recognition');
        setIsLoading(false);
      }
    };

    initGestureRecognizer();

    return () => {
      if (gestureRecognizerRef.current) {
        gestureRecognizerRef.current.close();
      }
    };
  }, [isEnabled]);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Could not access camera');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Detect gestures
  const detectGestures = () => {
    if (!gestureRecognizerRef.current || !videoRef.current) return;

    const video = videoRef.current;
    if (video.readyState < 2) return;

    const result = gestureRecognizerRef.current.recognizeForVideo(
      video,
      performance.now()
    );

    if (result.gestures.length > 0) {
      const gesture = result.gestures[0][0];
      const gestureName = mapGestureName(gesture.categoryName);
      
      setCurrentGesture(gestureName);
      setConfidence(gesture.score);
    } else {
      setCurrentGesture(null);
      setConfidence(0);
    }

    detectionLoopRef.current = requestAnimationFrame(detectGestures);
  };

  // Map MediaPipe gesture names to our custom names
  const mapGestureName = (mpGesture) => {
    const mapping = {
      'Open_Palm': 'raised_hand',
      'Thumb_Up': 'thumbs_up',
      'Thumb_Down': 'thumbs_down',
      'Victory': 'peace_sign',
      'ILoveYou': 'peace_sign' // Fallback
    };
    return mapping[mpGesture] || null;
  };

  // Start detection
  useEffect(() => {
    if (isEnabled && gestureRecognizerRef.current) {
      startCamera();
      detectGestures();
    }

    return () => {
      if (detectionLoopRef.current) {
        cancelAnimationFrame(detectionLoopRef.current);
      }
      stopCamera();
    };
  }, [isEnabled]);

  return {
    videoRef,
    currentGesture,
    confidence,
    isLoading,
    error
  };
};