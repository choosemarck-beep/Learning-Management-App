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

    // Calculate completion statistics
    const [
      totalTrainings,
      totalCourses,
      trainingCompletions,
      courseCompletions,
      totalEnrollments,
      completionRateByTraining,
      completionRateByCourse,
      completionTrends,
    ] = await Promise.all([
      // Total trainings created by trainer
      prisma.training.count({
        where: { createdBy: currentUser.id },
      }),
      // Total courses created by trainer
      prisma.course.count({
        where: { createdBy: currentUser.id },
      }),
      // Training completions in date range
      prisma.trainingProgressNew.count({
        where: {
          trainingId: { in: trainingIds },
          isCompleted: true,
          updatedAt: { gte: startDate },
        },
      }),
      // Course completions in date range
      prisma.courseProgress.count({
        where: {
          courseId: { in: courseIds },
          isCompleted: true,
          updatedAt: { gte: startDate },
        },
      }),
      // Total enrollments
      Promise.all([
        prisma.trainingProgressNew.count({
          where: { trainingId: { in: trainingIds } },
        }),
        prisma.courseProgress.count({
          where: { courseId: { in: courseIds } },
        }),
      ]).then(([training, course]) => training + course),
      // Completion rate by training
      Promise.all(
        trainerTrainings.map(async (training) => {
          const total = await prisma.trainingProgressNew.count({
            where: { trainingId: training.id },
          });
          const completed = await prisma.trainingProgressNew.count({
            where: {
              trainingId: training.id,
              isCompleted: true,
            },
          });
          return {
            trainingId: training.id,
            trainingTitle: training.title,
            totalEnrollments: total,
            completions: completed,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          };
        })
      ),
      // Completion rate by course
      Promise.all(
        trainerCourses.map(async (course) => {
          const total = await prisma.courseProgress.count({
            where: { courseId: course.id },
          });
          const completed = await prisma.courseProgress.count({
            where: {
              courseId: course.id,
              isCompleted: true,
            },
          });
          return {
            courseId: course.id,
            courseTitle: course.title,
            totalEnrollments: total,
            completions: completed,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          };
        })
      ),
      // Completion trends (daily for last N days)
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
            trainingCompletions,
            courseCompletions,
            totalCompletions: trainingCompletions + courseCompletions,
          });
        }
        return trends;
      })(),
    ]);

    const overallCompletionRate =
      totalEnrollments > 0
        ? Math.round(
            ((trainingCompletions + courseCompletions) / totalEnrollments) * 100
          )
        : 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          totalTrainings,
          totalCourses,
          totalEnrollments,
          trainingCompletions,
          courseCompletions,
          totalCompletions: trainingCompletions + courseCompletions,
          overallCompletionRate,
          completionRateByTraining: completionRateByTraining.sort(
            (a, b) => b.completionRate - a.completionRate
          ),
          completionRateByCourse: completionRateByCourse.sort(
            (a, b) => b.completionRate - a.completionRate
          ),
          completionTrends,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] /api/trainer/analytics/completion error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

