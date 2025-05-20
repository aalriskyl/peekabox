"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";

// Define the shape of our context
type TimerContextType = {
  seconds: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  restart: () => void;
  formattedTime: string;
};

// Create context with a default undefined value
const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Constants for localStorage keys
const TIMER_SECONDS_KEY = "peekabox_timer_seconds";
const TIMER_RUNNING_KEY = "peekabox_timer_running";
const TIMER_START_TIME_KEY = "peekabox_timer_start_time";

// Props for our provider component
type TimerProviderProps = {
  children: React.ReactNode;
  initialSeconds?: number;
};

export function TimerProvider({
  children,
  initialSeconds = 120,
}: TimerProviderProps) {
  // Get initial state from localStorage if available
  const getInitialSeconds = () => {
    if (typeof window === "undefined") return initialSeconds;

    const savedSeconds = localStorage.getItem(TIMER_SECONDS_KEY);
    if (savedSeconds) {
      const parsedSeconds = parseInt(savedSeconds, 10);
      return !isNaN(parsedSeconds) ? parsedSeconds : initialSeconds;
    }
    return initialSeconds;
  };

  const getInitialRunning = () => {
    if (typeof window === "undefined") return false;

    const savedRunning = localStorage.getItem(TIMER_RUNNING_KEY);
    return savedRunning === "true";
  };

  // State
  const [seconds, setSeconds] = useState(getInitialSeconds);
  const [isRunning, setIsRunning] = useState(getInitialRunning);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number | null>(null);

  // Format time as MM:SS
  const formattedTime = React.useMemo(() => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }, [seconds]);

  // Save state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TIMER_SECONDS_KEY, seconds.toString());
    }
  }, [seconds]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TIMER_RUNNING_KEY, isRunning.toString());

      if (isRunning) {
        localStorage.setItem(TIMER_START_TIME_KEY, Date.now().toString());
      } else {
        localStorage.removeItem(TIMER_START_TIME_KEY);
      }
    }
  }, [isRunning]);

  // Timer controls
  const start = () => {
    console.log("Timer started");
    setIsRunning(true);
    lastTickRef.current = Date.now();
  };

  const pause = () => {
    console.log("Timer paused");
    setIsRunning(false);
  };

  const reset = () => {
    console.log("Timer reset");
    setIsRunning(false);
    setSeconds(initialSeconds);
    localStorage.removeItem(TIMER_SECONDS_KEY);
    localStorage.removeItem(TIMER_RUNNING_KEY);
    localStorage.removeItem(TIMER_START_TIME_KEY);
  };

  // Combined reset and start function for reliable timer restart
  const restart = () => {
    console.log("Timer restarting");
    // First reset everything
    setSeconds(initialSeconds);
    localStorage.removeItem(TIMER_SECONDS_KEY);
    localStorage.removeItem(TIMER_RUNNING_KEY);
    localStorage.removeItem(TIMER_START_TIME_KEY);

    // Then start the timer with a small delay to ensure state is updated
    setTimeout(() => {
      setIsRunning(true);
      lastTickRef.current = Date.now();
      console.log("Timer restarted successfully");
    }, 50);
  };

  // Handle timer resumption after page refresh or remount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const startTimeStr = localStorage.getItem(TIMER_START_TIME_KEY);

      if (startTimeStr && isRunning) {
        const startTime = parseInt(startTimeStr, 10);
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);

        // Update the timer to account for time that passed while the component was unmounted
        if (!isNaN(elapsedSeconds) && elapsedSeconds > 0) {
          setSeconds((prev) => Math.max(0, prev - elapsedSeconds));
        }
      }
    }
  }, [isRunning]);

  // Set up the interval when isRunning changes
  useEffect(() => {
    if (isRunning && seconds > 0) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Start a new interval
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const lastTick = lastTickRef.current || now;
        const delta = Math.floor((now - lastTick) / 1000);

        if (delta >= 1) {
          setSeconds((prev) => {
            const newValue = Math.max(0, prev - delta);
            // If timer reaches 0, stop it
            if (newValue === 0) {
              setIsRunning(false);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            }
            return newValue;
          });
          lastTickRef.current = now;
        }
      }, 250); // Check more frequently for smoother updates

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isRunning, seconds]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Create the context value
  const contextValue: TimerContextType = {
    seconds,
    isRunning,
    start,
    pause,
    reset,
    restart,
    formattedTime,
  };

  return (
    <TimerContext.Provider value={contextValue}>
      {children}
    </TimerContext.Provider>
  );
}

// Custom hook to use the timer context
export function useTimer() {
  const context = useContext(TimerContext);

  if (context === undefined) {
    throw new Error("useTimer must be used within a TimerProvider");
  }

  return context;
}
