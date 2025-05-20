"use client";

import { useRouter } from "next/navigation";
import { useLoading } from "../../../contexts/LoadingContext";
import { useEffect, useRef } from "react";

export default function LandingPage() {
  const router = useRouter();
  const { setPageLoading } = useLoading();
  const gradientRef = useRef<HTMLDivElement>(null);

  // Color stops for our gradient animation
  const colors = [
    "#3b82f6", // blue-500
    "#f59e0b", // yellow-500
    "#ec4899", // pink-500
    "#3b82f6", // blue-500 (loop back to start)
  ];

  const handleNavigate = () => {
    setPageLoading(true);
    router.push("/code");
  };

  useEffect(() => {
    if (!gradientRef.current) return;

    let step = 0;
    const speed = 0.002; // Animation speed (lower = slower)
    const element = gradientRef.current;

    const animateGradient = () => {
      if (!element) return;

      // Calculate intermediate color stops
      const color1 = Math.floor(step) % 3;
      const color2 = (color1 + 1) % 3;
      const ratio = step % 1;

      // Create smooth gradient between current and next color
      element.style.background = `
        linear-gradient(
          135deg,
          ${mixColors(colors[color1], colors[color2], ratio)} 0%,
          ${mixColors(colors[color1 + 1], colors[color2 + 1], ratio)} 50%,
          ${mixColors(colors[color1 + 2], colors[color2 + 2], ratio)} 100%
        )
      `;

      step += speed;
      requestAnimationFrame(animateGradient);
    };

    // Start animation
    const animationId = requestAnimationFrame(animateGradient);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Helper function to blend colors smoothly
  const mixColors = (color1: string, color2: string, ratio: number) => {
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio);

    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div
      ref={gradientRef}
      className="min-h-screen flex items-center justify-center transition-all duration-1000"
    >
      <div className="text-center px-4">
        <h1 className="text-5xl md:text-6xl font-alfa text-white mb-4 font-black tracking-wide drop-shadow-lg">
          Welcome To Peek-A-Box
        </h1>
        <button
          onClick={handleNavigate}
          className="px-8 py-2 cursor-pointer font-bold font-alfa tracking-wider text-white text-2xl hover:scale-105 transition-transform duration-300"
        >
          Click here to start
        </button>
      </div>
    </div>
  );
}
