"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";

export default function EmailPage() {
  const [email, setEmail] = useState("");
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Get the final image path from localStorage
    const storedImagePath = localStorage.getItem("finalImagePath");
    if (!storedImagePath) {
      toast.error("No image found. Please create your photo first.");
      router.push("/customize");
      return;
    }
    setImagePath(storedImagePath);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic email validation
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!imagePath) {
      toast.error("No image found. Please create your photo first.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          imagePath,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      toast.success("Email sent successfully!");

      // Clear the stored image path
      localStorage.removeItem("finalImagePath");

      // Redirect to a thank you page or back to home
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Send Your Photo
            </h1>
            <p className="text-gray-600">
              Enter your email address to receive your photo
            </p>
          </div>

          {imagePath && (
            <div className="mb-8 flex justify-center">
              <div className="relative w-full h-64">
                <Image
                  src={imagePath}
                  alt="Your combined photo"
                  fill
                  className="object-contain rounded-md"
                />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* <button
                type="button"
                onClick={() => router.push('/customize')}
                className="px-6 py-3 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition flex-1"
              >
                Back
              </button> */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex-1 disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : "Send Email"}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>You can also download your photo directly from this page.</p>
            {imagePath && (
              <a
                href={imagePath}
                download="peekabox-photo.png"
                className="mt-2 inline-block text-blue-600 hover:underline"
              >
                Download Photo
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
