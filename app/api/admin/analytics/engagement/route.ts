import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get current user
    let user;
    try {
      user = await getCurrentUser();
    } catch (authError) {
      console.error("[Analytics Engagement] Error getting current user:", authError);
      return NextResponse.json(
        { success: false, error: "Authentication error" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin or super admin
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      // Build where clause - exclude ADMIN and SUPER_ADMIN
      const employeeWhere = {
        role: {
          notIn: ["ADMIN", "SUPER_ADMIN"],
        },
        status: "APPROVED",
      };

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date(today);
      lastMonth.setDate(lastMonth.getDate() - 30);

      // Engagement analytics
      const [
        dau,
        wau,
        mau,
        totalVideoWatchTime,
        averageVideoWatchTime,
        totalLearningTime,
        activityByHour,
        activityByDay,
        activityTrend,
      ] = await Promise.all([
        // Daily Active Users (DAU) - users with activity in last 24 hours
        prisma.user.count({
          where: {
            ...employeeWhere,
            OR: [
              {
                activityLogs: {
                  some: {
                    createdAt: {
                      gte: yesterday,
                    },
                  },
                },
              },
              {
                sessions: {
                  some: {
                    createdAt: {
                      gte: yesterday,
                    },
                  },
                },
              },
            ],
          },
        }),
        // Weekly Active Users (WAU) - users with activity in last 7 days
        prisma.user.count({
          where: {
            ...employeeWhere,
            OR: [
              {
                activityLogs: {
                  some: {
                    createdAt: {
                      gte: lastWeek,
                    },
                  },
                },
              },
              {
                sessions: {
                  some: {
                    createdAt: {
                      gte: lastWeek,
                    },
                  },
                },
              },
            ],
          },
        }),
        // Monthly Active Users (MAU) - users with activity in last 30 days
        prisma.user.count({
          where: {
            ...employeeWhere,
            OR: [
              {
                activityLogs: {
                  some: {
                    createdAt: {
                      gte: lastMonth,
                    },
                  },
                },
              },
              {
                sessions: {
                  some: {
                    createdAt: {
                      gte: lastMonth,
                    },
                  },
                },
              },
            ],
          },
        }),
        // Total video watch time (in seconds)
        Promise.all([
          prisma.videoWatchProgress.aggregate({
            _sum: {
              watchedSeconds: true,
            },
          }),
          prisma.trainingProgressNew.aggregate({
            _sum: {
              videoWatchedSeconds: true,
            },
          }),
        ]).then(([lessonVideo, trainingVideo]) => {
          const lessonSeconds = lessonVideo._sum.watchedSeconds || 0;
          const trainingSeconds = trainingVideo._sum.videoWatchedSeconds || 0;
          return lessonSeconds + trainingSeconds;
        }),
        // Average video watch time per user
        Promise.all([
          prisma.videoWatchProgress.aggregate({
            _avg: {
              watchedSeconds: true,
            },
          }),
          prisma.trainingProgressNew.aggregate({
            _avg: {
              videoWatchedSeconds: true,
            },
          }),
        ]).then(([lessonAvg, trainingAvg]) => {
          const lessonAvgSeconds = lessonAvg._avg.watchedSeconds || 0;
          const trainingAvgSeconds = trainingAvg._avg.videoWatchedSeconds || 0;
          return Math.round((lessonAvgSeconds + trainingAvgSeconds) / 2);
        }),
        // Total learning time (estimate from video watch time + quiz time)
        Promise.all([
          prisma.videoWatchProgress.aggregate({
            _sum: {
              watchedSeconds: true,
            },
          }),
          prisma.trainingProgressNew.aggregate({
            _sum: {
              videoWatchedSeconds: true,
            },
          }),
          prisma.quizAttempt.aggregate({
            where: {
              timeSpent: { not: null },
            },
            _sum: {
              timeSpent: true,
            },
          }),
          prisma.miniQuizAttempt.aggregate({
            where: {
              timeSpent: { not: null },
            },
            _sum: {
              timeSpent: true,
            },
          }),
        ]).then(([lessonVideo, trainingVideo, quizTime, miniQuizTime]) => {
          const videoSeconds = (lessonVideo._sum.watchedSeconds || 0) + (trainingVideo._sum.videoWatchedSeconds || 0);
          const quizSeconds = (quizTime._sum.timeSpent || 0) + (miniQuizTime._sum.timeSpent || 0);
          return videoSeconds + quizSeconds;
        }),
        // Activity by hour of day (0-23)
        (async () => {
          const hourData = Array.from({ length: 24 }, (_, hour) => ({
            hour,
            count: 0,
          }));

          const activities = await prisma.activityLog.findMany({
            where: {
              createdAt: { gte: startDate },
            },
            select: {
              createdAt: true,
            },
          });

          activities.forEach(activity => {
            const hour = new Date(activity.createdAt).getHours();
            hourData[hour].count++;
          });

          return hourData;
        })(),
        // Activity by day of week (0-6, Sunday-Saturday)
        (async () => {
          const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const dayData = dayNames.map((name, index) => ({
            day: name,
            dayIndex: index,
            count: 0,
          }));

          const activities = await prisma.activityLog.findMany({
            where: {
              createdAt: { gte: startDate },
            },
            select: {
              createdAt: true,
            },
          });

          activities.forEach(activity => {
            const dayIndex = new Date(activity.createdAt).getDay();
            dayData[dayIndex].count++;
          });

          return dayData;
        })(),
        // Activity trend (daily for date range)
        (async () => {
          const trendData = [];
          for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const count = await prisma.activityLog.count({
              where: {
                createdAt: {
                  gte: date,
                  lt: nextDate,
                },
              },
            });

            trendData.push({
              date: date.toISOString().split("T")[0],
              count,
            });
          }
          return trendData;
        })(),
      ]);

      // Calculate average session duration (estimate from session expires - createdAt)
      const sessions = await prisma.session.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        select: {
          createdAt: true,
          expires: true,
        },
        take: 1000, // Sample size
      });

      const sessionDurations = sessions
        .map(session => {
          const duration = new Date(session.expires).getTime() - new Date(session.createdAt).getTime();
          return duration / 1000 / 60; // Convert to minutes
        })
        .filter(d => d > 0 && d < 1440); // Filter out invalid durations (0 or > 24 hours)

      const averageSessionDuration = sessionDurations.length > 0
        ? Math.round(sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length)
        : 0;

      return NextResponse.json(
        {
          success: true,
          data: {
            dau,
            wau,
            mau,
            averageSessionDuration, // in minutes
            totalVideoWatchTime, // in seconds
            averageVideoWatchTime, // in seconds
            totalLearningTime, // in seconds (video + quiz)
            activityByHour,
            activityByDay,
            activityTrend,
            dateRange: {
              days,
              startDate: startDate.toISOString(),
              endDate: new Date().toISOString(),
            },
          },
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("[Analytics Engagement] Database error:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch engagement analytics" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Analytics Engagement] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

