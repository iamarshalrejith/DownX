import React, { useState, useEffect } from 'react';
import { useGestureDetection } from '../../hooks/useGestureDetection';
import GestureIndicator from './GestureIndicator';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Hand,
  ThumbsUp,
  ThumbsDown,
  HandMetal,
  X,
  Camera,
  AlertCircle
} from 'lucide-react';

const GestureDetector = ({
  enrollmentId,
  taskId = null,
  isEnabled = true,
  onGestureDetected = null
}) => {

  // Declare state FIRST
  const [showCamera, setShowCamera] = useState(false);
  const [lastLoggedGesture, setLastLoggedGesture] = useState(null);
  const [gestureHoldTime, setGestureHoldTime] = useState(0);

  // Then call the hook
  const {
    videoRef,
    currentGesture,
    confidence,
    isLoading,
    error,
    cameraReady
  } = useGestureDetection(isEnabled && showCamera);

  const CONFIDENCE_THRESHOLD = 0.7;
  const HOLD_DURATION = 2000;

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
    if (!enrollmentId) {
      console.warn('No enrollmentId provided');
      return;
    }

    try {
      console.log(`Logging gesture: ${gestureType}`);
      const response = await axios.post('/api/gestures/log', {
        enrollmentId,
        gestureType,
        confidence: confidenceScore,
        taskId,
        context: {
          timestamp: new Date().toISOString()
        }
      });

      // Toast feedback with icons
      if (gestureType === 'raised_hand') {
        toast.success('Help request sent to your teacher!', {
          duration: 4000,
          icon: <Hand size={18} />
        });
      } else if (gestureType === 'thumbs_up') {
        toast.success('Great job! Keep it up!', {
          duration: 3000,
          icon: <ThumbsUp size={18} />
        });
      } else if (gestureType === 'thumbs_down') {
        toast('Let me know if you need help!', {
          duration: 3000,
          icon: <ThumbsDown size={18} />
        });
      } else if (gestureType === 'peace_sign') {
        toast.success('Awesome! Task marked as finished!', {
          duration: 3000,
          icon: <HandMetal size={18} />
        });
      }

      if (onGestureDetected) {
        onGestureDetected(gestureType, response.data);
      }

      console.log('Gesture logged successfully');

    } catch (error) {
      console.error('Error logging gesture:', error);
      toast.error('Could not send gesture signal');
    }
  };

  if (!isEnabled) return null;

  return (
    <div className="gesture-detector">
      
      {/* Toggle Camera Button */}
      <button
        onClick={() => setShowCamera(!showCamera)}
        className="fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-40 transition-all hover:scale-105"
      >
        <Hand size={20} />
        <span className="font-medium">
          {showCamera ? 'Hide' : 'Show'} Gesture Help
        </span>
      </button>

      {/* Camera Panel */}
      {showCamera && (
        <div className="fixed bottom-20 right-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden border-4 border-blue-500">
            
            {/* Header */}
            <div className="bg-blue-500 text-white px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera size={16} />
                <span className="font-bold text-sm">Gesture Helper</span>
              </div>
              <button
                onClick={() => setShowCamera(false)}
                className="hover:text-gray-200 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Video Feed Container */}
            <div className="relative bg-gray-900">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-64 h-48 object-cover"
                style={{ 
                  display: cameraReady ? 'block' : 'none',
                  transform: 'scaleX(-1)' // Mirror effect
                }}
              />

              {/* Loading State */}
              {(isLoading || !cameraReady) && !error && (
                <div className="absolute inset-0 w-64 h-48 bg-gray-800 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm">
                      {isLoading ? 'Loading model...' : 'Starting camera...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="absolute inset-0 w-64 h-48 bg-red-500 bg-opacity-90 flex items-center justify-center">
                  <div className="text-white text-center px-4">
                    <AlertCircle size={32} className="mx-auto mb-2" />
                    <p className="text-xs font-semibold mb-2">Camera Error</p>
                    <p className="text-xs">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-3 bg-white text-red-500 px-3 py-1 rounded text-xs font-semibold hover:bg-gray-100 transition"
                    >
                      Reload Page
                    </button>
                  </div>
                </div>
              )}

              {/* Camera Ready Indicator */}
              {cameraReady && !error && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  Live
                </div>
              )}

              {/* Hold Progress Bar */}
              {currentGesture && confidence >= CONFIDENCE_THRESHOLD && cameraReady && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-2">
                  <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-green-500 h-full transition-all duration-100 ease-linear"
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
            <div className="bg-gray-50 p-3">
              <p className="font-bold text-gray-700 mb-2 text-xs">Available Gestures:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 bg-red-50 p-2 rounded border border-red-200">
                  <Hand size={14} className="text-red-500 flex-shrink-0" />
                  <span className="text-gray-700">Need Help</span>
                </div>
                <div className="flex items-center gap-2 bg-green-50 p-2 rounded border border-green-200">
                  <ThumbsUp size={14} className="text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Doing Great</span>
                </div>
                <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded border border-yellow-200">
                  <ThumbsDown size={14} className="text-yellow-500 flex-shrink-0" />
                  <span className="text-gray-700">Confused</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 p-2 rounded border border-blue-200">
                  <HandMetal size={14} className="text-blue-500 flex-shrink-0" />
                  <span className="text-gray-700">Finished</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Right Gesture Indicator */}
      {currentGesture && confidence >= CONFIDENCE_THRESHOLD && (
        <GestureIndicator gesture={currentGesture} confidence={confidence} />
      )}
    </div>
  );
};

export default GestureDetector;