import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "TRAINER") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Trainer access only" },
        { status: 403 }
      );
    }

    // Fetch all trainings created by this trainer (from courses)
    const trainings = await prisma.training.findMany({
      where: {
        createdBy: user.id,
      },
      select: {
        id: true,
        title: true,
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Fetch all courses created by this trainer
    const courses = await prisma.course.findMany({
      where: {
        createdBy: user.id,
      },
      select: {
        id: true,
        title: true,
        trainings: {
          select: {
            id: true,
          },
        },
      },
    });

    const trainingIds = trainings.map((t) => t.id);
    const courseIds = courses.map((c) => c.id);

    // Get all training IDs from courses (for course-level aggregation)
    const allCourseTrainingIds = courses.flatMap((c) => c.trainings.map((t) => t.id));

    // Count total TrainingProgressNew records for trainer's trainings
    const totalAssigned = await prisma.trainingProgressNew.count({
      where: {
        trainingId: { in: trainingIds },
      },
    });

    // Count completed TrainingProgressNew records
    const totalCompleted = await prisma.trainingProgressNew.count({
      where: {
        trainingId: { in: trainingIds },
        isCompleted: true,
      },
    });

    // Calculate overall completion rate
    const overallCompletionRate =
      totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;

    // Get per-training stats
    const trainingStats = await Promise.all(
      trainings.map(async (training) => {
        const assigned = await prisma.trainingProgressNew.count({
          where: {
            trainingId: training.id,
          },
        });

        const completed = await prisma.trainingProgressNew.count({
          where: {
            trainingId: training.id,
            isCompleted: true,
          },
        });

        const completionRate = assigned > 0 ? (completed / assigned) * 100 : 0;

        return {
          trainingId: training.id,
          title: training.title,
          courseTitle: training.course?.title,
          completionRate: Math.round(completionRate * 100) / 100, // Round to 2 decimal places
          totalAssigned: assigned,
          totalCompleted: completed,
        };
      })
    );

    // Get per-course stats (aggregate all trainings in the course)
    const courseStats = await Promise.all(
      courses.map(async (course) => {
        const courseTrainingIds = course.trainings.map((t) => t.id);

        if (courseTrainingIds.length === 0) {
          return {
            courseId: course.id,
            title: course.title,
            completionRate: 0,
            totalAssigned: 0,
            totalCompleted: 0,
            trainingCount: 0,
          };
        }

        const assigned = await prisma.trainingProgressNew.count({
          where: {
            trainingId: { in: courseTrainingIds },
          },
        });

        const completed = await prisma.trainingProgressNew.count({
          where: {
            trainingId: { in: courseTrainingIds },
            isCompleted: true,
          },
        });

        const completionRate = assigned > 0 ? (completed / assigned) * 100 : 0;

        return {
          courseId: course.id,
          title: course.title,
          completionRate: Math.round(completionRate * 100) / 100,
          totalAssigned: assigned,
          totalCompleted: completed,
          trainingCount: courseTrainingIds.length,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          overallCompletionRate: Math.round(overallCompletionRate * 100) / 100,
          totalAssigned,
          totalCompleted,
          trainingStats,
          courseStats,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching trainer dashboard stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboard stats",
      },
      { status: 500 }
    );
  }
}

