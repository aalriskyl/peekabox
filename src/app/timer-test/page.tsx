"use client";

import { useTimer } from "@/src/contexts/TimerContext";
import { useEffect, useState } from "react";

export default function TimerTestPage() {
  const { seconds, isRunning, start, pause, reset, formattedTime } = useTimer();
  const [logs, setLogs] = useState<string[]>([]);

  // Add log with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().substr(11, 8);
    setLogs((prev) => [`${timestamp} - ${message}`, ...prev.slice(0, 19)]);
  };

  // Log timer state changes
  useEffect(() => {
    addLog(`Timer state: ${seconds}s, running: ${isRunning}`);
  }, [seconds, isRunning]);

  // Start timer on mount
  useEffect(() => {
    addLog("Component mounted");
    reset();
    // Auto-start after 1 second
    const timer = setTimeout(() => {
      start();
      addLog("Timer auto-started");
    }, 1000);

    return () => {
      clearTimeout(timer);
      addLog("Component unmounting");
    };
  }, [reset, start]);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Timer Test Page</h1>

        <div className="mb-8 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-5xl font-mono font-bold">{formattedTime}</div>
            <div className="mt-2 text-sm text-gray-500">
              {isRunning ? "Timer is running" : "Timer is paused"}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => {
                start();
                addLog("Start button clicked");
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              disabled={isRunning}
            >
              Start
            </button>
            <button
              onClick={() => {
                pause();
                addLog("Pause button clicked");
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              disabled={!isRunning}
            >
              Pause
            </button>
            <button
              onClick={() => {
                reset();
                addLog("Reset button clicked");
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 font-medium border-b">
            Timer Logs (most recent first)
          </div>
          <div className="p-4 max-h-80 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500 italic">No logs yet</div>
            ) : (
              <div className="space-y-1 font-mono text-sm">
                {logs.map((log, index) => (
                  <div key={index} className="pb-1 border-b border-gray-100">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
