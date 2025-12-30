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
      console.error("[Analytics Learning] Error getting current user:", authError);
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
          notIn: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        },
        status: UserStatus.APPROVED,
      };

      // Learning progress analytics
      const [
        totalUsers,
        usersWithProgress,
        totalCompletions,
        courseCompletions,
        trainingCompletions,
        averageProgress,
        completionRateByCourse,
        completionRateByBranch,
        usersAtRisk,
        progressDistribution,
      ] = await Promise.all([
        // Total active users
        prisma.user.count({
          where: employeeWhere,
        }),
        // Users with at least one course/training progress
        prisma.user.count({
          where: {
            ...employeeWhere,
            OR: [
              { courseProgresses: { some: {} } },
              { trainingProgressesNew: { some: {} } },
            ],
          },
        }),
        // Total completions
        Promise.all([
          prisma.courseProgress.count({
            where: { isCompleted: true },
          }),
          prisma.trainingProgressNew.count({
            where: { isCompleted: true },
          }),
        ]).then(([course, training]) => ({
          course,
          training,
          total: course + training,
        })),
        // Course completions
        prisma.courseProgress.count({
          where: { isCompleted: true },
        }),
        // Training completions
        prisma.trainingProgressNew.count({
          where: { isCompleted: true },
        }),
        // Average progress across all courses/trainings
        Promise.all([
          prisma.courseProgress.aggregate({
            _avg: {
              progress: true,
            },
          }),
          prisma.trainingProgressNew.aggregate({
            _avg: {
              progress: true,
            },
          }),
          prisma.courseProgress.count(),
          prisma.trainingProgressNew.count(),
        ]).then(([courseAvg, trainingAvg, courseCount, trainingCount]) => {
          const courseProgress = courseAvg._avg.progress || 0;
          const trainingProgress = trainingAvg._avg.progress || 0;
          const totalCount = courseCount + trainingCount;
          if (totalCount === 0) return 0;
          // Weighted average
          const weightedAvg = (courseProgress * courseCount + trainingProgress * trainingCount) / totalCount;
          return Math.round(weightedAvg);
        }),
        // Completion rate by course
        prisma.course.findMany({
          select: {
            id: true,
            title: true,
            courseProgresses: {
              select: {
                isCompleted: true,
              },
            },
          },
        }).then(courses =>
          courses.map(course => {
            const total = course.courseProgresses.length;
            const completed = course.courseProgresses.filter(p => p.isCompleted).length;
            return {
              courseId: course.id,
              courseTitle: course.title,
              totalEnrollments: total,
              completions: completed,
              completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            };
          })
        ),
        // Completion rate by branch
        prisma.user.groupBy({
          by: ["branch"],
          where: {
            ...employeeWhere,
            branch: { not: null },
          },
          _count: {
            id: true,
          },
        }).then(async (branches) => {
          const branchStats = await Promise.all(
            branches.map(async (branch) => {
              const users = await prisma.user.findMany({
                where: {
                  ...employeeWhere,
                  branch: branch.branch,
                },
                select: { id: true },
              });

              const userIds = users.map(u => u.id);

              const [courseCompletions, trainingCompletions, totalProgress] = await Promise.all([
                prisma.courseProgress.count({
                  where: {
                    userId: { in: userIds },
                    isCompleted: true,
                  },
                }),
                prisma.trainingProgressNew.count({
                  where: {
                    userId: { in: userIds },
                    isCompleted: true,
                  },
                }),
                prisma.courseProgress.count({
                  where: {
                    userId: { in: userIds },
                  },
                }) + prisma.trainingProgressNew.count({
                  where: {
                    userId: { in: userIds },
                  },
                }),
              ]);

              return {
                branch: branch.branch || "Unknown",
                totalUsers: branch._count.id,
                totalCompletions: courseCompletions + trainingCompletions,
                completionRate: totalProgress > 0
                  ? Math.round(((courseCompletions + trainingCompletions) / totalProgress) * 100)
                  : 0,
              };
            })
          );
          return branchStats;
        }),
        // Users at risk (low progress, no recent activity)
        prisma.user.findMany({
          where: {
            ...employeeWhere,
            AND: [
              {
                OR: [
                  {
                    courseProgresses: {
                      some: {
                        progress: { lt: 50 },
                        updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                      },
                    },
                  },
                  {
                    trainingProgressesNew: {
                      some: {
                        progress: { lt: 50 },
                        updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                      },
                    },
                  },
                ],
              },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
            branch: true,
            department: true,
          },
          take: 20, // Limit to top 20 at-risk users
        }),
        // Progress distribution
        Promise.all([
          // 0-25%
          prisma.courseProgress.count({
            where: { progress: { gte: 0, lt: 25 } },
          }) + prisma.trainingProgressNew.count({
            where: { progress: { gte: 0, lt: 25 } },
          }),
          // 25-50%
          prisma.courseProgress.count({
            where: { progress: { gte: 25, lt: 50 } },
          }) + prisma.trainingProgressNew.count({
            where: { progress: { gte: 25, lt: 50 } },
          }),
          // 50-75%
          prisma.courseProgress.count({
            where: { progress: { gte: 50, lt: 75 } },
          }) + prisma.trainingProgressNew.count({
            where: { progress: { gte: 50, lt: 75 } },
          }),
          // 75-100%
          prisma.courseProgress.count({
            where: { progress: { gte: 75, lt: 100 } },
          }) + prisma.trainingProgressNew.count({
            where: { progress: { gte: 75, lt: 100 } },
          }),
          // 100% (completed)
          prisma.courseProgress.count({
            where: { progress: 100, isCompleted: true },
          }) + prisma.trainingProgressNew.count({
            where: { progress: 100, isCompleted: true },
          }),
        ]).then(([range0_25, range25_50, range50_75, range75_100, completed]) => ({
          "0-25%": range0_25,
          "25-50%": range25_50,
          "50-75%": range50_75,
          "75-100%": range75_100,
          "100% (Completed)": completed,
        })),
      ]);

      // Calculate overall completion rate
      const overallCompletionRate = totalUsers > 0 && usersWithProgress > 0
        ? Math.round((usersWithProgress / totalUsers) * 100)
        : 0;

      return NextResponse.json(
        {
          success: true,
          data: {
            overallCompletionRate,
            averageProgress,
            totalCompletions: totalCompletions.total,
            courseCompletions,
            trainingCompletions,
            completionRateByCourse: completionRateByCourse.sort((a, b) => b.completionRate - a.completionRate),
            completionRateByBranch,
            usersAtRisk,
            progressDistribution,
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
      console.error("[Analytics Learning] Database error:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch learning analytics" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Analytics Learning] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

