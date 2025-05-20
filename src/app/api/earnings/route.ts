/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "all"; // 'day', 'month', 'year', 'all'

  try {
    const now = new Date();
    let startDate: Date = new Date(0); // Default to beginning of time

    // Set start date based on period
    switch (period) {
      case "day":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "all":
      default:
        // No date filter
        break;
    }

    // Count sessions based on the date filter
    const sessionCount = await prisma.session.count({
      where: {
        createdAt:
          period !== "all"
            ? {
                gte: startDate,
              }
            : undefined,
      },
    });

    // Calculate total earnings (35,000 IDR per session)
    const totalEarnings = sessionCount * 35000;

    // Get daily data for the last 30 days for the chart
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyData = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM 
        Session
      WHERE 
        createdAt >= ${thirtyDaysAgo}
      GROUP BY 
        DATE(createdAt)
      ORDER BY 
        date ASC
    `;

    const serializedDailyData = (dailyData as any[]).map((item) => ({
      ...item,
      count: typeof item.count === "bigint" ? Number(item.count) : item.count,
    }));

    return NextResponse.json({
      data: {
        totalSessions: sessionCount,
        totalEarnings,
        chartData: serializedDailyData || [],
      },
      message: "Earnings data retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching earnings data:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings data" },
      { status: 500 }
    );
  }
}
