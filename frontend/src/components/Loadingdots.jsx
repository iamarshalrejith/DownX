import React from "react";

export default function LoadingScreen({ size = "w-4 h-4", color = "bg-blue-500", gap = "mx-1" }) {
  return (
    <div className="flex items-center justify-center">
      <span className={`${size} ${color} ${gap} rounded-full animate-ping`} style={{ animationDuration: '0.6s' }}></span>
      <span className={`${size} ${color} ${gap} rounded-full animate-ping`} style={{ animationDuration: '0.6s', animationDelay: '0.2s' }}></span>
      <span className={`${size} ${color} ${gap} rounded-full animate-ping`} style={{ animationDuration: '0.6s', animationDelay: '0.4s' }}></span>
    </div>
  );
}

