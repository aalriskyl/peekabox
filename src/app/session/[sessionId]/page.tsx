"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import { TimerProvider, useTimer } from "@/src/contexts/TimerContext";
import { start } from "repl";

// Dynamically import the WebcamCapture component with SSR disabled
const WebcamCapture = dynamic<WebcamCaptureProps>(
  () =>
    import("../../../components/webcam/WebcamCapture").then(
      (mod) => mod.default
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-pink-50 rounded-3xl">
        <div className="animate-pulse flex items-center gap-2 text-pink-500">
          <span className="text-2xl">📸</span>
          <span>Loading camera...</span>
        </div>
      </div>
    ),
  }
);

type WebcamCaptureProps = {
  onCapture: (imageSrc: string) => void;
  maxPhotos?: number;
  photosTaken?: number;
};

type SessionData = {
  id: string;
  code: string;
  isUsed: boolean;
  createdAt: string;
  updatedAt: string;
};

function Timer({ onTimeUp }: { onTimeUp?: () => void }) {
  const { seconds, formattedTime } = useTimer();

  const getColor = () => {
    if (seconds > 60) return "text-green-400";
    if (seconds > 30) return "text-yellow-400";
    return "text-red-400";
  };

  const progress = (seconds / 120) * 100;

  useEffect(() => {
    if (seconds === 0 && onTimeUp) {
      onTimeUp();
    }
  }, [seconds, onTimeUp]);

  return (
    <div className="relative w-20 h-20">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#f3e8ff"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className={`${getColor()} drop-shadow-sm`}
          strokeDasharray="283"
          strokeDashoffset={283 - (283 * progress) / 100}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xl font-mono font-bold ${getColor()}`}>
          {formattedTime}
        </span>
      </div>
      <div className="absolute -top-1 -right-1 text-xl">
        {seconds > 60 ? "😊" : seconds > 30 ? "😃" : "⏳"}
      </div>
    </div>
  );
}

const SessionContent = ({ sessionId }: { sessionId: string }) => {
  const router = useRouter();
  const { restart, start } = useTimer();
  const [session, setSession] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleTimeUp = useCallback(() => {
    router.push("/timeout");
  }, [router]);

  const currentSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId;

  const handleCapture = useCallback(
    async (imageSrc: string) => {
      if (imageSrc === "") {
        setCapturedImages((prev) => prev.slice(0, -1));
        return;
      }

      if (capturedImages.length >= 6) return;

      try {
        setIsUploading(true);
        setUploadError(null);

        const blob = await fetch(imageSrc).then((res) => res.blob());
        const file = new File([blob], `photo-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "sessionId",
          localStorage.getItem("currentSessionId") || ""
        );

        const response = await fetch("/api/session/photos", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to upload photo");
        }

        const { data } = await response.json();
        setCapturedImages((prev) => [...prev, data.url]);
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : "Failed to upload photo"
        );
      } finally {
        setIsUploading(false);
      }
    },
    [capturedImages.length]
  );

  useEffect(() => {
    const checkSession = async () => {
      try {
        const savedSessionCode = localStorage.getItem("currentSessionCode");
        if (!savedSessionCode) throw new Error("No active session found");
        start();
        console.log("Timer restarted in session page");

        setSession({
          id: currentSessionId,
          code: savedSessionCode,
          isUsed: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid session");
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [currentSessionId, start]);

  const handleGoBack = () => {
    localStorage.removeItem("currentSessionId");
    localStorage.removeItem("currentSessionCode");
    router.push("/code");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-3xl shadow-lg border-2 border-pink-200">
          <div className="animate-bounce text-4xl mb-4">📸</div>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-pink-700 font-medium">
            Getting your session ready...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-8">
        <div className="max-w-md mx-auto mt-20">
          <button
            onClick={handleGoBack}
            className="mb-8 inline-flex items-center gap-2 text-pink-600 hover:text-pink-800 transition-colors text-sm"
          >
            <span>←</span> Back to Code Entry
          </button>

          <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-pink-200">
            <h1 className="text-2xl font-bold mb-4 text-pink-600 flex items-center gap-2">
              <span>⚠️</span> Oops!
            </h1>
            <p className="text-gray-700 mb-6">{error}</p>
            <button
              onClick={handleGoBack}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-medium rounded-full transition-all shadow-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex flex-col overflow-hidden">
      {/* Timer Display */}
      <div className="absolute top-6 right-6 z-50">
        <div className="bg-white p-3 rounded-full shadow-lg border-2 border-pink-200">
          <Timer onTimeUp={handleTimeUp} />
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-4 left-6 text-3xl">✨</div>
      <div className="absolute bottom-20 left-8 text-4xl">📷</div>
      <div className="absolute bottom-10 right-10 text-3xl">😊</div>

      <div className="w-full max-w-4xl mx-auto h-full flex flex-col py-6">
        <div className="flex-1 flex flex-col h-full bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-pink-200">
          {/* Captured Images Preview */}
          {capturedImages.length > 0 && (
            <div className="h-28 bg-gradient-to-r from-pink-100 to-purple-100 border-b-2 border-pink-200 p-3 overflow-x-auto">
              <div className="flex gap-3 h-full">
                {capturedImages.slice(0, 6).map((imgSrc, index) => (
                  <div
                    key={index}
                    className="h-full aspect-square flex-shrink-0 rounded-xl overflow-hidden border-2 border-white shadow-md relative hover:scale-105 transition-transform"
                  >
                    <Image
                      src={imgSrc}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute bottom-1 right-1 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Webcam Section */}
          <div className="flex-1 flex flex-col relative">
            {uploadError && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-4 mt-4 rounded-lg flex items-center justify-between">
                <span>{uploadError}</span>
                <button
                  onClick={() => setUploadError(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>
            )}

            <div className="relative flex-1">
              {isUploading && (
                <div className="absolute inset-0 bg-pink-500/20 backdrop-blur-sm flex items-center justify-center z-10 rounded-b-3xl">
                  <div className="text-center bg-white p-6 rounded-2xl shadow-lg border-2 border-pink-300">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto mb-3"></div>
                    <p className="text-pink-700 font-medium">
                      Uploading your photo...
                    </p>
                  </div>
                </div>
              )}
              <WebcamCapture
                onCapture={handleCapture}
                maxPhotos={6}
                photosTaken={capturedImages.length}
              />
            </div>

            {/* Next Button */}
            {capturedImages.length === 6 && (
              <div className="p-4 bg-gradient-to-r from-pink-100 to-purple-100 border-t-2 border-pink-200 flex justify-center">
                <button
                  onClick={() => router.push("/customize")}
                  className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold rounded-full transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <span>🎉</span> Next: Customize Your Photos!
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

type SessionPageProps = {
  params: { sessionId: string | string[] };
};

export default function SessionPage({ params }: SessionPageProps) {
  const sessionId = Array.isArray(params.sessionId)
    ? params.sessionId[0]
    : params.sessionId;

  return (
    <TimerProvider>
      <SessionContent sessionId={sessionId} />
    </TimerProvider>
  );
}
