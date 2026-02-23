import React, { useState, useEffect } from 'react';
import { useGestureDetection } from '../../hooks/useGestureDetection';
import GestureIndicator from './GestureIndicator';
import axios from 'axios';
import toast from 'react-hot-toast';

const GestureDetector = ({ 
  enrollmentId, 
  taskId = null, 
  isEnabled = true,
  onGestureDetected = null 
}) => {
  const {
    videoRef,
    currentGesture,
    confidence,
    isLoading,
    error
  } = useGestureDetection(isEnabled);

  const [lastLoggedGesture, setLastLoggedGesture] = useState(null);
  const [gestureHoldTime, setGestureHoldTime] = useState(0);
  const [showCamera, setShowCamera] = useState(false);

  const CONFIDENCE_THRESHOLD = 0.7; // 70% confidence required
  const HOLD_DURATION = 2000; // Hold gesture for 2 seconds to trigger

  // Track gesture hold duration
  useEffect(() => {
    if (!currentGesture || confidence < CONFIDENCE_THRESHOLD) {
      setGestureHoldTime(0);
      return;
    }

    const interval = setInterval(() => {
      setGestureHoldTime(prev => prev + 100);
    }, 100);

    return () => clearInterval(interval);
  }, [currentGesture, confidence]);

  // Log gesture when held long enough
  useEffect(() => {
    if (gestureHoldTime >= HOLD_DURATION && currentGesture !== lastLoggedGesture) {
      logGesture(currentGesture, confidence);
      setLastLoggedGesture(currentGesture);
      setGestureHoldTime(0);
    }
  }, [gestureHoldTime, currentGesture]);

  // Log gesture to backend
  const logGesture = async (gestureType, confidenceScore) => {
    try {
      const response = await axios.post('/api/gestures/log', {
        enrollmentId,
        gestureType,
        confidence: confidenceScore,
        taskId,
        context: {
          timestamp: new Date().toISOString()
        }
      });

      // Show feedback based on gesture type
      if (gestureType === 'raised_hand') {
        toast.success('Help request sent to your teacher!', {
          duration: 4000,
          icon: '✋'
        });
      } else if (gestureType === 'thumbs_up') {
        toast.success('Great job! Keep it up! 🎉', {
          duration: 3000,
          icon: '👍'
        });
      } else if (gestureType === 'thumbs_down') {
        toast('Let me know if you need help!', {
          duration: 3000,
          icon: '👎'
        });
      } else if (gestureType === 'peace_sign') {
        toast.success('Awesome! Task marked as finished! ✨', {
          duration: 3000,
          icon: '✌️'
        });
      }

      // Callback for parent component
      if (onGestureDetected) {
        onGestureDetected(gestureType, response.data);
      }

    } catch (error) {
      console.error('Error logging gesture:', error);
      toast.error('Could not send gesture signal');
    }
  };

  if (!isEnabled) return null;

  return (
    <div className="gesture-detector">
      {/* Toggle Camera View Button */}
      <button
        onClick={() => setShowCamera(!showCamera)}
        className="fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-40"
      >
        <span className="text-xl">👋</span>
        <span className="font-medium">
          {showCamera ? 'Hide' : 'Show'} Gesture Help
        </span>
      </button>

      {/* Camera Feed (Small, Minimized) */}
      {showCamera && (
        <div className="fixed bottom-20 right-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden border-4 border-blue-500">
            {/* Header */}
            <div className="bg-blue-500 text-white px-3 py-2 flex items-center justify-between">
              <span className="font-bold text-sm">Gesture Helper</span>
              <button
                onClick={() => setShowCamera(false)}
                className="text-white hover:text-gray-200 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Video Feed */}
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-64 h-48 object-cover"
              />

              {/* Loading Overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm">Loading...</p>
                  </div>
                </div>
              )}

              {/* Error Overlay */}
              {error && (
                <div className="absolute inset-0 bg-red-500 bg-opacity-90 flex items-center justify-center">
                  <div className="text-white text-center px-4">
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Gesture Progress Bar */}
              {currentGesture && confidence >= CONFIDENCE_THRESHOLD && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
                  <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-green-500 h-full transition-all duration-100"
                      style={{ width: `${(gestureHoldTime / HOLD_DURATION) * 100}%` }}
                    />
                  </div>
                  <p className="text-white text-xs text-center mt-1">
                    Hold gesture to confirm...
                  </p>
                </div>
              )}
            </div>

            {/* Gesture Guide */}
            <div className="bg-gray-50 p-3 text-xs">
              <p className="font-bold text-gray-700 mb-2">Available Gestures:</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <span>✋</span>
                  <span className="text-gray-600">Need Help</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>👍</span>
                  <span className="text-gray-600">Doing Great</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>👎</span>
                  <span className="text-gray-600">Confused</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>✌️</span>
                  <span className="text-gray-600">Finished</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gesture Indicator (Top Right) */}
      {currentGesture && confidence >= CONFIDENCE_THRESHOLD && (
        <GestureIndicator gesture={currentGesture} confidence={confidence} />
      )}
    </div>
  );
};

export default GestureDetector;