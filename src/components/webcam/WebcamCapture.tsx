/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";

const videoConstraints = {
  width: 640, // Reduced from 1280 for smaller webcam view
  height: 480, // Reduced from 720 for smaller webcam view
  facingMode: "user",
};

type WebcamCaptureProps = {
  onCapture: (imageSrc: string) => void;
  maxPhotos?: number;
  photosTaken?: number;
};

export default function WebcamCapture({
  onCapture,
  maxPhotos = 6,
  photosTaken = 0,
}: WebcamCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const captureRequested = useRef(false);
  const canTakePhoto = photosTaken < maxPhotos;

  // We'll just use the mirrored prop on the webcam component

  useEffect(() => {
    if (countdown === 0 && captureRequested.current) {
      const imageSrc = webcamRef.current?.getScreenshot({
        width: 511,
        height: 327,
      });
      if (imageSrc) {
        // The webcam component's mirrored prop will handle the mirroring automatically
        setImgSrc(imageSrc);
        setShowPreview(true);
      }
      captureRequested.current = false;
    }
  }, [countdown]);

  const capture = useCallback(() => {
    if (!webcamRef.current || !canTakePhoto || countdown !== null) return;

    captureRequested.current = true;
    setCountdown(3);
    setShowPreview(false);
    setImgSrc(null);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [canTakePhoto, countdown]);

  const handleNextPhoto = useCallback(() => {
    if (imgSrc) {
      onCapture(imgSrc);
    }
    setShowPreview(false);
    setImgSrc(null);
    setCountdown(null);
  }, [imgSrc, onCapture]);

  const handleRetakeAll = useCallback(() => {
    onCapture("");
    setShowPreview(false);
    setImgSrc(null);
    setCountdown(null);
  }, [onCapture]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Webcam Feed - now smaller */}
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        {!showPreview && (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full h-full object-contain max-w-xl rounded-3xl"
            screenshotQuality={1} // Ensure highest quality before resize
            mirrored={true} // Enable mirroring in the webcam component - this mirrors both the display AND the captured image
          />
        )}

        {showPreview && imgSrc && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex flex-col items-center justify-center p-4">
            <div className="relative" style={{ width: 511, height: 327 }}>
              <img
                src={imgSrc}
                alt="Captured preview"
                className="w-full h-full object-contain rounded-3xl"
                width={511}
                height={327}
              />
            </div>
            <div className="mt-4 flex gap-4">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setImgSrc(null);
                  setCountdown(null);
                }}
                className="px-6 py-2 bg-white text-gray-800 rounded-md font-medium hover:bg-gray-100 transition-colors"
              >
                Retake
              </button>
              <button
                onClick={handleNextPhoto}
                className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
              >
                {photosTaken >= maxPhotos - 1 ? "Finish" : "Next Photo"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Capture Button */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        {!showPreview && canTakePhoto && (
          <button
            onClick={capture}
            disabled={countdown !== null}
            className={`h-16 w-16 rounded-full bg-white border-4 border-gray-200 shadow-lg flex items-center justify-center transition-colors ${
              countdown === null ? "hover:bg-gray-50" : "opacity-75"
            }`}
            aria-label={
              countdown ? `Taking photo in ${countdown}...` : "Take photo"
            }
          >
            {countdown ? (
              <span className="text-xl font-bold text-gray-800">
                {countdown}
              </span>
            ) : (
              <div className="h-12 w-12 rounded-full bg-red-500"></div>
            )}
          </button>
        )}
      </div>

      {/* Photo Counter and Retake All Button */}
      {!showPreview && (
        <div className="absolute top-4 right-4 flex items-center gap-4">
          {photosTaken > 0 && photosTaken < maxPhotos && (
            <button
              onClick={handleRetakeAll}
              className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
            >
              Retake All
            </button>
          )}
          <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            {photosTaken}/{maxPhotos}
          </div>
        </div>
      )}
    </div>
  );
}
