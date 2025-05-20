"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CalendarDaysIcon,
  PhotoIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { Session } from "@/src/types/session";
import { CodeModal } from "@/src/components/session/CodeModal";
interface DashboardStats {
  totalSessions: number;
  totalPhotos: number;
  totalFrames: number;
  totalEarnings: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    totalPhotos: 0,
    totalFrames: 0,
    totalEarnings: 0,
  });
  const [period, setPeriod] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch stats from the earnings API with period filter
      const response = await fetch(`/api/earnings?period=${period}`);
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const responseData = await response.json();
      const { totalSessions, totalEarnings } = responseData.data;

      // For now, we'll keep the photos and frames as is
      // You can update this if you want to filter them by period as well
      const photosResponse = await fetch("/api/session");
      if (!photosResponse.ok) {
        throw new Error("Failed to fetch photos");
      }
      const sessionsData = await photosResponse.json();
      const sessions: Session[] = sessionsData.data?.formattedSessions || [];
      const totalPhotos = sessions.reduce((sum: number, session: Session) => {
        return sum + (session.photoCount || 0);
      }, 0);

      setStats({
        totalSessions,
        totalPhotos,
        totalFrames: 0, // You can update this if you have frame data
        totalEarnings,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Set default values in case of error
      setStats({
        totalSessions: 0,
        totalPhotos: 0,
        totalFrames: 0,
        totalEarnings: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Add period filter UI
  const PeriodFilter = () => (
    <div className="flex space-x-2 mb-6">
      <button
        onClick={() => setPeriod("day")}
        className={`px-3 py-1 rounded-md text-sm font-medium ${
          period === "day"
            ? "bg-blue-100 text-blue-800"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        Today
      </button>
      <button
        onClick={() => setPeriod("month")}
        className={`px-3 py-1 rounded-md text-sm font-medium ${
          period === "month"
            ? "bg-blue-100 text-blue-800"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        This Month
      </button>
      <button
        onClick={() => setPeriod("year")}
        className={`px-3 py-1 rounded-md text-sm font-medium ${
          period === "year"
            ? "bg-blue-100 text-blue-800"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        This Year
      </button>
      <button
        onClick={() => setPeriod("all")}
        className={`px-3 py-1 rounded-md text-sm font-medium ${
          period === "all"
            ? "bg-blue-100 text-blue-800"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        All Time
      </button>
    </div>
  );

  // State for code generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGenerateCode = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch("/api/generate-session-code", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate code");
      }

      setGeneratedCode(data.code);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to generate code:", error);
      // You might want to show an error toast here
    } finally {
      setIsGenerating(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Format currency for IDR
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const statCards = [
    {
      name: "Total Sessions",
      value: stats.totalSessions,
      icon: CalendarDaysIcon,
      href: "/dashboard/sessions",
      color: "bg-blue-500",
    },
    {
      name: "Total Photos",
      value: stats.totalPhotos,
      icon: PhotoIcon,
      href: "/dashboard/sessions",
      color: "bg-green-500",
    },
    {
      name: "Available Frames",
      value: stats.totalFrames,
      icon: ArrowTrendingUpIcon,
      href: "/dashboard/frames",
      color: "bg-purple-500",
    },
    {
      name: "Total Earnings",
      value: formatCurrency(stats.totalEarnings),
      icon: CurrencyDollarIcon,
      href: "/dashboard/earnings",
      color: "bg-yellow-500",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Overview of your photo sessions and earnings
            </p>
          </div>
          <PeriodFilter />
        </div>
      </div>

      {/* Stats Cards - Updated to 4 columns */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${card.color}`}>
                  <card.icon
                    className="h-6 w-6 text-white"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.name}
                    </dt>
                    <dd>
                      {isLoading ? (
                        <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        <div className="text-lg font-medium text-gray-900">
                          {card.value}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link
                  href={card.href}
                  className="font-medium text-blue-700 hover:text-blue-900"
                >
                  View all
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
            <div className="px-5 py-4">
              <h3 className="text-lg font-medium text-gray-900">New Session</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start a new photo session with your customers.
              </p>
            </div>
            <div className="px-5 py-4">
              <button
                onClick={handleGenerateCode}
                disabled={isGenerating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? "Generating..." : "Generate Session Code"}
              </button>
            </div>
          </div>

          <CodeModal
            isOpen={isModalOpen}
            onClose={closeModal}
            code={generatedCode || ""}
          />

          <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
            <div className="px-5 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                Upload Frame
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Add a new photo frame to your collection.
              </p>
            </div>
            <div className="px-5 py-4">
              <Link
                href="/dashboard/frames/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Upload Frame
              </Link>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
            <div className="px-5 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                View Profile
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Update your account settings and preferences.
              </p>
            </div>
            <div className="px-5 py-4">
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Profile Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
