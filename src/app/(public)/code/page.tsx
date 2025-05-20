"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLoading } from "../../../contexts/LoadingContext";

export default function CodePage() {
  const router = useRouter();
  const { setPageLoading } = useLoading();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoBack = () => {
    setPageLoading(true);
    router.push("/landing");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setError("Please enter a session code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const startResponse = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmedCode }),
      });

      const startData = await startResponse.json();

      if (!startResponse.ok)
        throw new Error(startData.message || "Failed to start session");
      if (!startData.data) throw new Error("Invalid response from server");

      localStorage.setItem(
        "currentSessionId",
        String(startData.data.sessionId)
      );
      localStorage.setItem(
        "currentSessionCode",
        startData.data.code || trimmedCode
      );

      setPageLoading(true);
      router.push(`/session/${trimmedCode}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid session code. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-pink-100">
      <div className="w-full max-w-sm p-6">
        <div className="bg-white p-8 rounded-xl shadow-sm">
          <h1 className="text-2xl font-bold text-center mb-6">
            Please Enter Your Session Code
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (error) setError("");
                }}
                placeholder="A1B2-C3D4"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  error ? "border-red-400" : "border-gray-300"
                }`}
                autoComplete="off"
                autoFocus
              />
              {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleGoBack}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isLoading ? "Loading..." : "Continue"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
