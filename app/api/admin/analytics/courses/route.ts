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
      console.error("[Analytics Courses] Error getting current user:", authError);
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
      // Course and training analytics
      const [
        totalCourses,
        publishedCourses,
        totalTrainings,
        publishedTrainings,
        mostPopularCourses,
        leastPopularCourses,
        mostPopularTrainings,
        leastPopularTrainings,
        coursesByCreator,
        trainingsByCreator,
        courseCreationTrend,
      ] = await Promise.all([
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
        // Most popular courses (by enrollment/completion)
        prisma.course.findMany({
          select: {
            id: true,
            title: true,
            isPublished: true,
            totalXP: true,
            courseProgresses: {
              select: {
                isCompleted: true,
              },
            },
          },
          orderBy: {
            courseProgresses: {
              _count: "desc",
            },
          },
          take: 10,
        }).then(courses =>
          courses.map(course => {
            const total = course.courseProgresses.length;
            const completed = course.courseProgresses.filter(p => p.isCompleted).length;
            return {
              courseId: course.id,
              title: course.title,
              isPublished: course.isPublished,
              totalXP: course.totalXP,
              enrollments: total,
              completions: completed,
              completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            };
          })
        ),
        // Least popular courses
        prisma.course.findMany({
          select: {
            id: true,
            title: true,
            isPublished: true,
            totalXP: true,
            courseProgresses: {
              select: {
                isCompleted: true,
              },
            },
          },
          orderBy: {
            courseProgresses: {
              _count: "asc",
            },
          },
          take: 10,
        }).then(courses =>
          courses.map(course => {
            const total = course.courseProgresses.length;
            const completed = course.courseProgresses.filter(p => p.isCompleted).length;
            return {
              courseId: course.id,
              title: course.title,
              isPublished: course.isPublished,
              totalXP: course.totalXP,
              enrollments: total,
              completions: completed,
              completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            };
          })
        ),
        // Most popular trainings
        prisma.training.findMany({
          select: {
            id: true,
            title: true,
            isPublished: true,
            totalXP: true,
            trainingProgressesNew: {
              select: {
                isCompleted: true,
              },
            },
          },
          take: 10,
        }).then(trainings =>
          trainings.sort((a, b) => b.trainingProgressesNew.length - a.trainingProgressesNew.length)
        ).then(trainings =>
          trainings.map(training => {
            const total = training.trainingProgressesNew.length;
            const completed = training.trainingProgressesNew.filter(p => p.isCompleted).length;
            return {
              trainingId: training.id,
              title: training.title,
              isPublished: training.isPublished,
              totalXP: training.totalXP,
              enrollments: total,
              completions: completed,
              completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            };
          })
        ),
        // Least popular trainings
        prisma.training.findMany({
          select: {
            id: true,
            title: true,
            isPublished: true,
            totalXP: true,
            trainingProgressesNew: {
              select: {
                isCompleted: true,
              },
            },
          },
          take: 10,
        }).then(trainings =>
          trainings.sort((a, b) => a.trainingProgressesNew.length - b.trainingProgressesNew.length)
        ).then(trainings =>
          trainings.map(training => {
            const total = training.trainingProgressesNew.length;
            const completed = training.trainingProgressesNew.filter(p => p.isCompleted).length;
            return {
              trainingId: training.id,
              title: training.title,
              isPublished: training.isPublished,
              totalXP: training.totalXP,
              enrollments: total,
              completions: completed,
              completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            };
          })
        ),
        // Courses by creator (trainer activity)
        prisma.course.groupBy({
          by: ["createdBy"],
          _count: {
            id: true,
          },
          where: {
            createdBy: { not: null },
          },
        }).then(async (groups) => {
          const creatorStats = await Promise.all(
            groups.map(async (group) => {
              const creator = await prisma.user.findUnique({
                where: { id: group.createdBy! },
                select: { name: true, email: true },
              });
              return {
                creatorId: group.createdBy,
                creatorName: creator?.name || "Unknown",
                coursesCreated: group._count.id,
              };
            })
          );
          return creatorStats.sort((a, b) => b.coursesCreated - a.coursesCreated);
        }),
        // Trainings by creator
        prisma.training.groupBy({
          by: ["createdBy"],
          _count: {
            id: true,
          },
          where: {
            createdBy: { not: null },
          },
        }).then(async (groups) => {
          const creatorStats = await Promise.all(
            groups.map(async (group) => {
              const creator = await prisma.user.findUnique({
                where: { id: group.createdBy! },
                select: { name: true, email: true },
              });
              return {
                creatorId: group.createdBy,
                creatorName: creator?.name || "Unknown",
                trainingsCreated: group._count.id,
              };
            })
          );
          return creatorStats.sort((a, b) => b.trainingsCreated - a.trainingsCreated);
        }),
        // Course creation trend (daily for date range)
        (async () => {
          const trendData = [];
          const today = new Date();
          for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const [coursesCreated, trainingsCreated] = await Promise.all([
              prisma.course.count({
                where: {
                  createdAt: {
                    gte: date,
                    lt: nextDate,
                  },
                },
              }),
              prisma.training.count({
                where: {
                  createdAt: {
                    gte: date,
                    lt: nextDate,
                  },
                },
              }),
            ]);

            trendData.push({
              date: date.toISOString().split("T")[0],
              courses: coursesCreated,
              trainings: trainingsCreated,
            });
          }
          return trendData;
        })(),
      ]);

      return NextResponse.json(
        {
          success: true,
          data: {
            totalCourses,
            publishedCourses,
            unpublishedCourses: totalCourses - publishedCourses,
            totalTrainings,
            publishedTrainings,
            unpublishedTrainings: totalTrainings - publishedTrainings,
            mostPopularCourses,
            leastPopularCourses,
            mostPopularTrainings,
            leastPopularTrainings,
            coursesByCreator,
            trainingsByCreator,
            creationTrend: courseCreationTrend,
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
      console.error("[Analytics Courses] Database error:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch course analytics" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Analytics Courses] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

