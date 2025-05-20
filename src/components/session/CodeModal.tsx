"use client";

import React, { useEffect } from "react";

type CodeModalProps = {
  code: string;
  onClose: () => void;
  isOpen: boolean;
};

export function CodeModal({ code, onClose, isOpen }: CodeModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      // You can add a toast notification here if you want
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-500">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <span className="text-2xl">&times;</span>
        </button>

        <h2 className="text-2xl font-bold mb-4 text-black">
          Your Session Code
        </h2>
        {/* <p className="text-gray-600 mb-6">
          Share this code with others to let them join your session.
        </p> */}

        <div className="flex items-center justify-between bg-gray-100 p-4 rounded-lg mb-6">
          <code className="text-2xl text-black font-bold font-mono tracking-wider uppercase">
            {code}
          </code>
          <button
            onClick={handleCopy}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            Copy
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
