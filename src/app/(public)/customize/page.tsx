"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import PhotoFrame from "@/src/components/layout/PhotoFrame";
import toast from "react-hot-toast";
import { TimerProvider, useTimer } from "@/src/contexts/TimerContext";
// import TimerDisplay from "@/src/components/TimerDisplay";

interface Photo {
  id: string;
  url: string;
  sessionId?: string;
  createdAt?: string;
  [key: string]: string | undefined;
}

interface Frame {
  id: string;
  url: string;
  filename: string;
  name: string;
  thumbnailUrl?: string;
  size: number;
  type: string;
  createdAt: string | Date;
}

function CustomizePageContent() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();
  const { seconds, formattedTime, start } = useTimer();

  // Use a ref to track if data has been fetched
  const dataFetchedRef = useRef(false);

  const framesPerPage = 3;
  const totalPages = Math.ceil(frames.length / framesPerPage);
  const visibleFrames = frames.slice(
    currentPage * framesPerPage,
    (currentPage + 1) * framesPerPage
  );

  // Timer display component with happy styling
  function HappyTimer() {
    const getColor = () => {
      if (seconds > 60) return "text-green-400";
      if (seconds > 30) return "text-yellow-400";
      return "text-red-400";
    };

    const progress = (seconds / 120) * 100;

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

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  const handlePhotosChange = (updatedPhotos: { id: string; url: string }[]) => {
    const processedPhotos = updatedPhotos.map((photo) => ({
      ...photo,
      sessionId: photos.find((p) => p.id === photo.id)?.sessionId || "",
      createdAt:
        photos.find((p) => p.id === photo.id)?.createdAt ||
        new Date().toISOString(),
    }));
    setPhotos(processedPhotos);
  };

  const processPhotos = (
    photos: Array<Partial<Photo> & { url: string }>
  ): Photo[] => {
    return photos.map((photo) => ({
      id: `photo-${Math.random().toString(36).substr(2, 9)}`,
      url: photo.url,
      sessionId: photo.sessionId || "",
      createdAt: photo.createdAt || new Date().toISOString(),
    }));
  };

  // const handleTimeUp = useCallback(() => {
  //   toast.error("Time's up! Your session has expired");
  //   router.push("/timeout");
  // }, [router]);

  // Fetch data function extracted for clarity
  const fetchData = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true);

      const photosResponse = await fetch(
        `/api/session/photos?sessionId=${sessionId}`
      );
      if (!photosResponse.ok) throw new Error("Failed to fetch photos");
      const photosData = await photosResponse.json();
      const photosArray = Array.isArray(photosData?.data)
        ? processPhotos(photosData.data)
        : [];
      setPhotos(photosArray);

      const framesResponse = await fetch("/api/frames");
      if (!framesResponse.ok) throw new Error("Failed to fetch frames");
      const framesData = await framesResponse.json();
      const framesArray = Array.isArray(framesData?.data)
        ? framesData.data
        : Array.isArray(framesData)
        ? framesData
        : [];
      setFrames(framesArray);
      if (framesArray.length > 0) {
        setSelectedFrame(framesArray[0].url);
      }
    } catch (err) {
      setError("Failed to load data. Please try again.");
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only run this effect once
    if (dataFetchedRef.current) return;

    const sessionId = localStorage.getItem("currentSessionId");
    if (!sessionId) {
      router.push("/");
      return;
    }

    // Start the timer when component mounts
    start();
    console.log("Timer started in customize page");

    // Mark as fetched before the async operation
    dataFetchedRef.current = true;

    // Fetch the data
    fetchData(sessionId);
  }, [router, start, fetchData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-3xl shadow-lg border-2 border-pink-200">
          <div className="animate-bounce text-4xl mb-4">🎨</div>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-pink-700 font-medium">
            Preparing your customization options...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-pink-200 max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-pink-600 flex items-center gap-2">
            <span>⚠️</span> Oops!
          </h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-medium rounded-full transition-all shadow-md"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center">
          {/* Header with Title and Timer */}
          <div className="w-full flex justify-between items-center">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold text-gray-900 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text"
            >
              Customize Your Photos
            </motion.h1>
            <div className="bg-white p-3 rounded-full shadow-lg border-2 border-pink-200">
              <HappyTimer />
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full flex flex-col lg:flex-row gap-6">
            {/* Left Side - Photo Frame Preview */}
            <div className="lg:w-2/3">
              <div className="">
                <PhotoFrame
                  photos={photos}
                  frameImage={selectedFrame || ""}
                  onPhotosChange={handlePhotosChange}
                />
              </div>
            </div>

            {/* Right Side - Frame Selection */}
            <div className="lg:w-1/3 space-y-6">
              <div className="">
                <h2 className="text-2xl font-bold text-center mb-6 text-pink-600">
                  Choose Your Frame
                </h2>
                <div className="min-h-[400px] flex flex-col">
                  <div className="flex-1">
                    <div className="grid grid-cols-3 gap-4 h-full">
                      {visibleFrames.map((frame, index) => (
                        <motion.div
                          key={frame.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.4,
                            delay: index * 0.1,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="flex flex-col h-full"
                        >
                          <button
                            onClick={() => setSelectedFrame(frame.url)}
                            className={`w-full h-full flex flex-col group relative overflow-hidden rounded-xl transition-all duration-300 ${
                              selectedFrame === frame.url
                                ? "ring-4 ring-pink-500 ring-offset-2 scale-105"
                                : "hover:scale-105 hover:shadow-lg"
                            }`}
                          >
                            <div className="relative h-64 bg-gray-50 rounded-xl overflow-hidden">
                              <Image
                                src={frame.thumbnailUrl || frame.url}
                                alt={frame.name}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              {selectedFrame === frame.url && (
                                <div className="absolute inset-0 bg-pink-500/10 rounded-xl" />
                              )}
                            </div>
                            <div className="mt-3 px-2 pb-2">
                              <p className="text-sm font-medium text-gray-700 text-center">
                                {frame.name}
                              </p>
                              {selectedFrame === frame.url && (
                                <div className="flex justify-center mt-1">
                                  <span className="h-1 w-6 bg-pink-500 rounded-full" />
                                </div>
                              )}
                            </div>
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-6 pt-4 border-t border-pink-100">
                      <div className="flex justify-center items-center space-x-2">
                        <button
                          onClick={handlePrevPage}
                          disabled={currentPage === 0}
                          className={`p-2 rounded-full ${
                            currentPage === 0
                              ? "text-gray-300"
                              : "text-pink-600 hover:bg-pink-50"
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i)}
                            className={`w-2 h-2 mx-1 rounded-full transition-all ${
                              i === currentPage
                                ? "bg-pink-500 w-6"
                                : "bg-pink-200"
                            }`}
                          />
                        ))}

                        <button
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages - 1}
                          className={`p-2 rounded-full ${
                            currentPage === totalPages - 1
                              ? "text-gray-300"
                              : "text-pink-600 hover:bg-pink-50"
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 w-full max-w-3xl"
          >
            <button
              onClick={async () => {
                if (photos.length === 0) {
                  toast.error("Please add photos before continuing");
                  return;
                }

                if (!selectedFrame) {
                  toast.error("Please select a frame");
                  return;
                }

                try {
                  setIsSaving(true);
                  const response = await fetch("/api/combine-photos", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      photos,
                      frameImage: selectedFrame.startsWith("/")
                        ? selectedFrame.substring(1)
                        : selectedFrame,
                    }),
                  });

                  const data = await response.json();

                  if (!response.ok) {
                    throw new Error(data.error || "Failed to combine photos");
                  }

                  if (data.imagePath) {
                    localStorage.setItem("finalImagePath", data.imagePath);
                    router.push("/email");
                  }
                } catch (error) {
                  console.error("Error combining photos:", error);
                  toast.error("Failed to combine photos. Please try again.");
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold text-xl rounded-full transition-all shadow-lg hover:shadow-xl disabled:opacity-70"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  🎉 Continue to Final Step
                </span>
              )}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function CustomizePage() {
  return (
    <TimerProvider>
      <CustomizePageContent />
    </TimerProvider>
  );
}
