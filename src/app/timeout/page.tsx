"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTimer } from "@/src/contexts/TimerContext";

export default function TimeoutPage() {
  const router = useRouter();
  const { reset } = useTimer();

  // Reset the timer when this page loads
  useEffect(() => {
    reset();
  }, [reset]);

  const handleGoHome = () => {
    router.push("/");
  };

  const handleStartNewSession = () => {
    router.push("/code");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-6">
          <svg
            className="h-12 w-12 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Time&apos;s Up!
        </h2>
        <p className="text-gray-600 mb-8">
          Your session has expired. Would you like to start a new session?
        </p>
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
          <button
            onClick={handleGoHome}
            className="px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Return Home
          </button>
          <button
            onClick={handleStartNewSession}
            className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Start New Session
          </button>
        </div>
      </div>
    </div>
  );
}
