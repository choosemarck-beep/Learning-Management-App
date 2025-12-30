import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { UserRole, UserStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is a trainer
    if (currentUser.role !== UserRole.TRAINER) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Trainer access required" },
        { status: 403 }
      );
    }

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get trainer's trainings and courses
    const trainerTrainings = await prisma.training.findMany({
      where: {
        createdBy: currentUser.id,
      },
      select: {
        id: true,
        title: true,
      },
    });

    const trainerCourses = await prisma.course.findMany({
      where: {
        createdBy: currentUser.id,
      },
      select: {
        id: true,
        title: true,
      },
    });

    const trainingIds = trainerTrainings.map(t => t.id);
    const courseIds = trainerCourses.map(c => c.id);

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setDate(lastMonth.getDate() - 30);

    // Calculate engagement metrics
    const [
      activeLearners,
      activeLearnersLastWeek,
      activeLearnersLastMonth,
      trainingEnrollments,
      courseEnrollments,
      averageTimeToComplete,
      trainingPopularity,
      coursePopularity,
      mostEngagedLearners,
      engagementTrend,
    ] = await Promise.all([
      // Active learners (users who completed trainings/courses in date range)
      prisma.user.count({
        where: {
          role: {
            notIn: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
          },
          status: UserStatus.APPROVED,
          OR: [
            {
              trainingProgressesNew: {
                some: {
                  trainingId: { in: trainingIds },
                  isCompleted: true,
                  updatedAt: { gte: startDate },
                },
              },
            },
            {
              courseProgresses: {
                some: {
                  courseId: { in: courseIds },
                  isCompleted: true,
                  updatedAt: { gte: startDate },
                },
              },
            },
          ],
        },
      }),
      // Active learners last week
      prisma.user.count({
        where: {
          role: {
            notIn: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
          },
          status: UserStatus.APPROVED,
          OR: [
            {
              trainingProgressesNew: {
                some: {
                  trainingId: { in: trainingIds },
                  isCompleted: true,
                  updatedAt: { gte: lastWeek },
                },
              },
            },
            {
              courseProgresses: {
                some: {
                  courseId: { in: courseIds },
                  isCompleted: true,
                  updatedAt: { gte: lastWeek },
                },
              },
            },
          ],
        },
      }),
      // Active learners last month
      prisma.user.count({
        where: {
          role: {
            notIn: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
          },
          status: UserStatus.APPROVED,
          OR: [
            {
              trainingProgressesNew: {
                some: {
                  trainingId: { in: trainingIds },
                  isCompleted: true,
                  updatedAt: { gte: lastMonth },
                },
              },
            },
            {
              courseProgresses: {
                some: {
                  courseId: { in: courseIds },
                  isCompleted: true,
                  updatedAt: { gte: lastMonth },
                },
              },
            },
          ],
        },
      }),
      // Training enrollments
      Promise.all(
        trainerTrainings.map(async (training) => {
          const enrollments = await prisma.trainingProgressNew.count({
            where: { trainingId: training.id },
          });
          return {
            trainingId: training.id,
            trainingTitle: training.title,
            enrollments,
          };
        })
      ),
      // Course enrollments
      Promise.all(
        trainerCourses.map(async (course) => {
          const enrollments = await prisma.courseProgress.count({
            where: { courseId: course.id },
          });
          return {
            courseId: course.id,
            courseTitle: course.title,
            enrollments,
          };
        })
      ),
      // Average time to complete (simplified - using updatedAt - createdAt)
      (async () => {
        const trainingCompletions = await prisma.trainingProgressNew.findMany({
          where: {
            trainingId: { in: trainingIds },
            isCompleted: true,
            updatedAt: { gte: startDate },
          },
          select: {
            createdAt: true,
            updatedAt: true,
          },
        });

        const courseCompletions = await prisma.courseProgress.findMany({
          where: {
            courseId: { in: courseIds },
            isCompleted: true,
            updatedAt: { gte: startDate },
          },
          select: {
            createdAt: true,
            updatedAt: true,
          },
        });

        const allCompletions = [...trainingCompletions, ...courseCompletions];
        if (allCompletions.length === 0) return 0;

        const totalTime = allCompletions.reduce((sum, completion) => {
          const timeDiff = completion.updatedAt.getTime() - completion.createdAt.getTime();
          return sum + timeDiff;
        }, 0);

        return Math.round(totalTime / allCompletions.length / (1000 * 60 * 60)); // Convert to hours
      })(),
      // Training popularity (sorted by enrollments)
      Promise.all(
        trainerTrainings.map(async (training) => {
          const enrollments = await prisma.trainingProgressNew.count({
            where: { trainingId: training.id },
          });
          return {
            trainingId: training.id,
            trainingTitle: training.title,
            enrollments,
          };
        })
      ).then(results => results.sort((a, b) => b.enrollments - a.enrollments)),
      // Course popularity (sorted by enrollments)
      Promise.all(
        trainerCourses.map(async (course) => {
          const enrollments = await prisma.courseProgress.count({
            where: { courseId: course.id },
          });
          return {
            courseId: course.id,
            courseTitle: course.title,
            enrollments,
          };
        })
      ).then(results => results.sort((a, b) => b.enrollments - a.enrollments)),
      // Most engaged learners (users who completed most trainings/courses)
      (async () => {
        const userCompletions = await prisma.user.findMany({
          where: {
            role: {
              notIn: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
            },
            status: UserStatus.APPROVED,
            OR: [
              {
                trainingProgressesNew: {
                  some: {
                    trainingId: { in: trainingIds },
                    isCompleted: true,
                    updatedAt: { gte: startDate },
                  },
                },
              },
              {
                courseProgresses: {
                  some: {
                    courseId: { in: courseIds },
                    isCompleted: true,
                    updatedAt: { gte: startDate },
                  },
                },
              },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            _count: {
              select: {
                trainingProgressesNew: {
                  where: {
                    trainingId: { in: trainingIds },
                    isCompleted: true,
                    updatedAt: { gte: startDate },
                  },
                },
                courseProgresses: {
                  where: {
                    courseId: { in: courseIds },
                    isCompleted: true,
                    updatedAt: { gte: startDate },
                  },
                },
              },
            },
          },
        });

        return userCompletions
          .map(user => ({
            userId: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            completions: user._count.trainingProgressesNew + user._count.courseProgresses,
          }))
          .sort((a, b) => b.completions - a.completions)
          .slice(0, 10);
      })(),
      // Engagement trend (daily completions)
      (async () => {
        const trends = [];
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + 1);

          const [trainingCompletions, courseCompletions] = await Promise.all([
            prisma.trainingProgressNew.count({
              where: {
                trainingId: { in: trainingIds },
                isCompleted: true,
                updatedAt: {
                  gte: date,
                  lt: nextDate,
                },
              },
            }),
            prisma.courseProgress.count({
              where: {
                courseId: { in: courseIds },
                isCompleted: true,
                updatedAt: {
                  gte: date,
                  lt: nextDate,
                },
              },
            }),
          ]);

          trends.push({
            date: date.toISOString().split('T')[0],
            completions: trainingCompletions + courseCompletions,
          });
        }
        return trends;
      })(),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          activeLearners,
          activeLearnersLastWeek,
          activeLearnersLastMonth,
          totalEnrollments: trainingEnrollments.reduce((sum, t) => sum + t.enrollments, 0) +
            courseEnrollments.reduce((sum, c) => sum + c.enrollments, 0),
          averageTimeToComplete,
          trainingPopularity: trainingPopularity.slice(0, 10),
          coursePopularity: coursePopularity.slice(0, 10),
          mostEngagedLearners,
          engagementTrend,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] /api/trainer/analytics/engagement error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

