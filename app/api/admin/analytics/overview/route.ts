import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { UserRole, UserStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get current user
    let user;
    try {
      user = await getCurrentUser();
    } catch (authError) {
      console.error("[Analytics Overview] Error getting current user:", authError);
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

    // Get date range from query params (default to last 30 days)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      // Build where clause - exclude ADMIN and SUPER_ADMIN from employee metrics
      const employeeWhere = {
        role: {
          notIn: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        },
        status: UserStatus.APPROVED,
      };

      // Overview metrics - all in parallel for performance
      const [
        totalUsers,
        newUsers,
        activeLearners,
        totalCourses,
        publishedCourses,
        totalTrainings,
        publishedTrainings,
        totalCompletions,
        totalXP,
        totalBadges,
        pendingApprovals,
      ] = await Promise.all([
        // Total active users (approved, not resigned)
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
            trainingProgressesNew: {
              some: {
                isCompleted: true,
                completedAt: {
                  gte: startDate,
                },
              },
            },
          },
        }),
        // Total courses
        prisma.course.count(),
        // Published courses
        prisma.course.count({
          where: { isPublished: true },
        }),
        // Total trainings
        prisma.training.count(),
        // Published trainings
        prisma.training.count({
          where: { isPublished: true },
        }),
        // Total completions (course + training)
        Promise.all([
          prisma.courseProgress.count({
            where: { isCompleted: true },
          }),
          prisma.trainingProgressNew.count({
            where: { isCompleted: true },
          }),
        ]).then(([courseCompletions, trainingCompletions]) => 
          courseCompletions + trainingCompletions
        ),
        // Total XP earned (sum of all user XP)
        prisma.user.aggregate({
          where: employeeWhere,
          _sum: {
            xp: true,
          },
        }).then(result => result._sum.xp || 0),
        // Total badges earned
        prisma.badge.count(),
        // Pending approvals
        prisma.user.count({
          where: {
            status: UserStatus.PENDING,
            role: {
              notIn: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
            },
          },
        }),
      ]);

      // Calculate completion rate
      const usersWithProgress = await prisma.user.count({
        where: {
          ...employeeWhere,
          OR: [
            { courseProgresses: { some: {} } },
            { trainingProgressesNew: { some: {} } },
          ],
        },
      });

      const completionRate = totalUsers > 0 && usersWithProgress > 0
        ? Math.round((usersWithProgress / totalUsers) * 100)
        : 0;

      // Average XP per user
      const averageXP = totalUsers > 0 ? Math.round(totalXP / totalUsers) : 0;

      return NextResponse.json(
        {
          success: true,
          data: {
            totalUsers,
            newUsers,
            activeLearners,
            totalCourses,
            publishedCourses,
            unpublishedCourses: totalCourses - publishedCourses,
            totalTrainings,
            publishedTrainings,
            unpublishedTrainings: totalTrainings - publishedTrainings,
            totalCompletions,
            completionRate,
            totalXP,
            averageXP,
            totalBadges,
            pendingApprovals,
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
      console.error("[Analytics Overview] Database error:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch overview analytics" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Analytics Overview] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

