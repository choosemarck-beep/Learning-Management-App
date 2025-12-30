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
      console.error("[Analytics Users] Error getting current user:", authError);
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

      // User analytics - all in parallel
      const [
        totalActiveUsers,
        newUsers,
        activeLearners,
        inactiveUsers30,
        inactiveUsers60,
        inactiveUsers90,
        usersByRole,
        usersByBranch,
        userGrowthData,
      ] = await Promise.all([
        // Total active users
        prisma.user.count({
          where: employeeWhere,
        }),
        // New users in date range
        prisma.user.count({
          where: {
            ...employeeWhere,
            createdAt: {
              gte: startDate,
            },
          },
        }),
        // Active learners (completed at least one training in date range)
        prisma.user.count({
          where: {
            ...employeeWhere,
            OR: [
              {
                trainingProgressesNew: {
                  some: {
                    isCompleted: true,
                    completedAt: {
                      gte: startDate,
                    },
                  },
                },
              },
              {
                courseProgresses: {
                  some: {
                    isCompleted: true,
                    updatedAt: {
                      gte: startDate,
                    },
                  },
                },
              },
            ],
          },
        }),
        // Inactive users (no activity in last 30 days)
        prisma.user.count({
          where: {
            ...employeeWhere,
            AND: [
              {
                OR: [
                  { activityLogs: { none: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } } },
                  { activityLogs: { none: {} } },
                ],
              },
            ],
          },
        }),
        // Inactive users (no activity in last 60 days)
        prisma.user.count({
          where: {
            ...employeeWhere,
            AND: [
              {
                OR: [
                  { activityLogs: { none: { createdAt: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } } } },
                  { activityLogs: { none: {} } },
                ],
              },
            ],
          },
        }),
        // Inactive users (no activity in last 90 days)
        prisma.user.count({
          where: {
            ...employeeWhere,
            AND: [
              {
                OR: [
                  { activityLogs: { none: { createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } } },
                  { activityLogs: { none: {} } },
                ],
              },
            ],
          },
        }),
        // Users by role
        prisma.user.groupBy({
          by: ["role"],
          where: employeeWhere,
          _count: {
            id: true,
          },
        }),
        // Users by branch
        prisma.user.groupBy({
          by: ["branch"],
          where: {
            ...employeeWhere,
            branch: { not: null },
          },
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: "desc",
            },
          },
        }),
        // User growth data (daily for the date range)
        (async () => {
          const growthData = [];
          const today = new Date();
          for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const count = await prisma.user.count({
              where: {
                ...employeeWhere,
                createdAt: {
                  lt: nextDate,
                },
              },
            });

            growthData.push({
              date: date.toISOString().split("T")[0],
              count,
            });
          }
          return growthData;
        })(),
      ]);

      // Format users by role
      const usersByRoleFormatted = usersByRole.map((item) => ({
        role: item.role,
        count: item._count.id,
      }));

      // Format users by branch
      const usersByBranchFormatted = usersByBranch.map((item) => ({
        branch: item.branch || "Unknown",
        count: item._count.id,
      }));

      return NextResponse.json(
        {
          success: true,
          data: {
            totalActiveUsers,
            newUsers,
            activeLearners,
            inactiveUsers: {
              last30Days: inactiveUsers30,
              last60Days: inactiveUsers60,
              last90Days: inactiveUsers90,
            },
            usersByRole: usersByRoleFormatted,
            usersByBranch: usersByBranchFormatted,
            userGrowth: userGrowthData,
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
      console.error("[Analytics Users] Database error:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch user analytics" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Analytics Users] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

