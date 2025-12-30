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
      console.error("[Analytics Gamification] Error getting current user:", authError);
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

      // Gamification analytics
      const [
        totalXP,
        averageXP,
        usersByLevel,
        topPerformers,
        totalBadges,
        badgesByType,
        activeStreaks,
        averageStreak,
        totalDiamonds,
        levelDistribution,
        xpEarnedTrend,
      ] = await Promise.all([
        // Total XP earned (system-wide)
        prisma.user.aggregate({
          where: employeeWhere,
          _sum: {
            xp: true,
          },
        }).then(result => result._sum.xp || 0),
        // Average XP per user
        prisma.user.aggregate({
          where: employeeWhere,
          _avg: {
            xp: true,
          },
        }).then(result => Math.round(result._avg.xp || 0)),
        // Users by level
        prisma.user.groupBy({
          by: ["level"],
          where: employeeWhere,
          _count: {
            id: true,
          },
          orderBy: {
            level: "asc",
          },
        }),
        // Top performers (highest XP, highest level)
        prisma.user.findMany({
          where: employeeWhere,
          select: {
            id: true,
            name: true,
            email: true,
            xp: true,
            level: true,
            rank: true,
            streak: true,
            diamonds: true,
            branch: true,
          },
          orderBy: [
            { xp: "desc" },
            { level: "desc" },
          ],
          take: 20,
        }),
        // Total badges earned
        prisma.badge.count(),
        // Badges by type
        prisma.badge.groupBy({
          by: ["type"],
          _count: {
            id: true,
          },
        }),
        // Active streaks (users with current streaks > 0)
        prisma.user.count({
          where: {
            ...employeeWhere,
            streak: { gt: 0 },
          },
        }),
        // Average streak length
        prisma.user.aggregate({
          where: employeeWhere,
          _avg: {
            streak: true,
          },
        }).then(result => Math.round(result._avg.streak || 0)),
        // Total diamonds/energy crystals
        prisma.user.aggregate({
          where: employeeWhere,
          _sum: {
            diamonds: true,
          },
        }).then(result => result._sum.diamonds || 0),
        // Level distribution
        prisma.user.groupBy({
          by: ["level"],
          where: employeeWhere,
          _count: {
            id: true,
          },
          orderBy: {
            level: "asc",
          },
        }).then(groups =>
          groups.map(group => ({
            level: group.level,
            count: group._count.id,
          }))
        ),
        // XP earned trend (daily for date range)
        (async () => {
          // This is a simplified version - in production, you'd track XP changes over time
          // For now, we'll calculate based on task completions and course/training completions
          const trendData = [];
          const today = new Date();
          for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            // Estimate XP earned from task completions and course/training completions
            const [taskCompletions, courseCompletions, trainingCompletions] = await Promise.all([
              prisma.taskCompletion.count({
                where: {
                  completedAt: {
                    gte: date,
                    lt: nextDate,
                  },
                },
              }),
              prisma.courseProgress.count({
                where: {
                  isCompleted: true,
                  completedAt: {
                    gte: date,
                    lt: nextDate,
                  },
                },
              }),
              prisma.trainingProgressNew.count({
                where: {
                  isCompleted: true,
                  completedAt: {
                    gte: date,
                    lt: nextDate,
                  },
                },
              }),
            ]);

            // Estimate: 10 XP per task, 50 XP per course, 50 XP per training (rough estimate)
            const estimatedXP = (taskCompletions * 10) + (courseCompletions * 50) + (trainingCompletions * 50);

            trendData.push({
              date: date.toISOString().split("T")[0],
              xp: estimatedXP,
            });
          }
          return trendData;
        })(),
      ]);

      // Format users by level
      const usersByLevelFormatted = usersByLevel.map(item => ({
        level: item.level,
        count: item._count.id,
      }));

      // Format badges by type
      const badgesByTypeFormatted = badgesByType.map(item => ({
        type: item.type,
        count: item._count.id,
      }));

      return NextResponse.json(
        {
          success: true,
          data: {
            totalXP,
            averageXP,
            usersByLevel: usersByLevelFormatted,
            topPerformers,
            totalBadges,
            badgesByType: badgesByTypeFormatted,
            activeStreaks,
            averageStreak,
            totalDiamonds,
            levelDistribution,
            xpEarnedTrend,
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
      console.error("[Analytics Gamification] Database error:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch gamification analytics" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Analytics Gamification] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

