'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface SaveFrameButtonProps {
  photos: { id: string; url: string }[];
  frameImage: string;
  onSaveComplete?: (finalImagePath: string) => void;
}

export default function SaveFrameButton({
  photos,
  frameImage,
  onSaveComplete,
}: SaveFrameButtonProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleCombineAndSave = async () => {
    if (photos.length === 0) {
      toast.error("Please add photos before saving");
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
          frameImage: frameImage.startsWith("/") ? frameImage.substring(1) : frameImage,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to combine photos");
      }
      
      toast.success("Photos combined successfully!");
      
      // Call the callback with the final image path if provided
      if (onSaveComplete && data.imagePath) {
        onSaveComplete(data.imagePath);
      }
    } catch (error) {
      console.error("Error combining photos:", error);
      toast.error("Failed to combine photos. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-20">
      <button
        onClick={handleCombineAndSave}
        disabled={isSaving}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? "Saving..." : "Save Final Image"}
      </button>
    </div>
  );
}
