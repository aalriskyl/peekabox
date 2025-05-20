"use client";

import { useTimer } from "@/src/contexts/TimerContext";
import { useEffect } from "react";

type TimerDisplayProps = {
  onTimeUp?: () => void;
  className?: string;
};

export default function TimerDisplay({
  onTimeUp,
  className = "",
}: TimerDisplayProps) {
  const { seconds, isRunning, formattedTime } = useTimer();

  console.log(
    "TimerDisplay render - seconds:",
    seconds,
    "isRunning:",
    isRunning
  );

  // Calculate progress for the circular indicator (0 to 100)
  const progress = (seconds / 120) * 100;

  // Call onTimeUp when timer reaches 0
  useEffect(() => {
    console.log("Seconds changed:", seconds);

    if (seconds === 0 && onTimeUp) {
      console.log("Time's up! Calling onTimeUp");
      onTimeUp();
    }
  }, [seconds, onTimeUp]);

  // Determine the color based on time left
  const getTimerColor = () => {
    if (seconds > 60) return "text-green-500";
    if (seconds > 30) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative w-16 h-16">
        {/* Circular progress background */}
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className={`transition-[stroke-dashoffset] duration-1000 ${getTimerColor()}`}
            strokeDasharray="283"
            strokeDashoffset={283 - (283 * progress) / 100}
            transform="rotate(-90 50 50)"
          />
        </svg>
        {/* Timer text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-mono font-bold ${getTimerColor()}`}>
            {formattedTime}
          </span>
        </div>
      </div>
    </div>
  );
}
