import React from 'react';
import { Hand, ThumbsUp, ThumbsDown, HandMetal } from 'lucide-react';

const GestureIndicator = ({ gesture, confidence }) => {
  const gestureIcons = {
    raised_hand: Hand,
    thumbs_up: ThumbsUp,
    thumbs_down: ThumbsDown,
    peace_sign: HandMetal
  };

  const gestureLabels = {
    raised_hand: 'Need Help',
    thumbs_up: 'Doing Great',
    thumbs_down: 'Confused',
    peace_sign: 'Finished'
  };

  const gestureColors = {
    raised_hand: 'bg-red-500',
    thumbs_up: 'bg-green-500',
    thumbs_down: 'bg-yellow-500',
    peace_sign: 'bg-blue-500'
  };

  if (!gesture) return null;

  const IconComponent = gestureIcons[gesture];

  return (
    <div
      className={`fixed top-4 right-4 ${gestureColors[gesture]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-bounce transition-all`}
    >
      {IconComponent && <IconComponent size={28} />}

      <div>
        <p className="font-bold">{gestureLabels[gesture]}</p>
        <p className="text-sm opacity-90">
          {Math.round(confidence * 100)}% confident
        </p>
      </div>
    </div>
  );
};

export default GestureIndicator;