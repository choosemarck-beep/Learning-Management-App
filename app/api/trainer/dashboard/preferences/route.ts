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

    // Fetch trainer's dashboard preferences
    const preferences = await prisma.trainerDashboardPreferences.findUnique({
      where: {
        trainerId: user.id,
      },
      select: {
        trainingIds: true,
        courseIds: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          trainingIds: preferences?.trainingIds || [],
          courseIds: preferences?.courseIds || [],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching trainer dashboard preferences:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboard preferences",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { trainingIds, courseIds } = body;

    // Validate trainingIds
    if (trainingIds !== undefined && !Array.isArray(trainingIds)) {
      return NextResponse.json(
        { success: false, error: "trainingIds must be an array" },
        { status: 400 }
      );
    }

    // Validate courseIds
    if (courseIds !== undefined && !Array.isArray(courseIds)) {
      return NextResponse.json(
        { success: false, error: "courseIds must be an array" },
        { status: 400 }
      );
    }

    const finalTrainingIds = trainingIds || [];
    const finalCourseIds = courseIds || [];

    // Verify all training IDs belong to this trainer (from courses)
    const trainings = await prisma.training.findMany({
      where: {
        id: { in: finalTrainingIds },
        createdBy: user.id,
      },
      select: {
        id: true,
      },
    });

    // Verify all course IDs belong to this trainer
    const courses = await prisma.course.findMany({
      where: {
        id: { in: finalCourseIds },
        createdBy: user.id,
      },
      select: {
        id: true,
      },
    });

    // Filter to only valid training IDs that belong to this trainer
    const validTrainingIds = trainings.map((t) => t.id);
    const invalidTrainingIds = finalTrainingIds.filter((id) => !validTrainingIds.includes(id));

    // Filter to only valid course IDs that belong to this trainer
    const validCourseIds = courses.map((c) => c.id);
    const invalidCourseIds = finalCourseIds.filter((id) => !validCourseIds.includes(id));

    // If there are invalid IDs, log them but continue with valid ones
    if (invalidTrainingIds.length > 0) {
      console.warn(
        `Trainer ${user.id} attempted to save invalid training IDs:`,
        invalidTrainingIds
      );
    }

    if (invalidCourseIds.length > 0) {
      console.warn(
        `Trainer ${user.id} attempted to save invalid course IDs:`,
        invalidCourseIds
      );
    }

    // Upsert preferences with only valid IDs
    const preferences = await prisma.trainerDashboardPreferences.upsert({
      where: {
        trainerId: user.id,
      },
      update: {
        trainingIds: validTrainingIds,
        courseIds: validCourseIds,
      },
      create: {
        trainerId: user.id,
        trainingIds: validTrainingIds,
        courseIds: validCourseIds,
      },
    });

    const warnings = [];
    if (invalidTrainingIds.length > 0) {
      warnings.push(`Removed ${invalidTrainingIds.length} invalid training ID(s)`);
    }
    if (invalidCourseIds.length > 0) {
      warnings.push(`Removed ${invalidCourseIds.length} invalid course ID(s)`);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          trainingIds: preferences.trainingIds,
          courseIds: preferences.courseIds,
        },
        ...(warnings.length > 0 && {
          warning: warnings.join(" and ") + " from your dashboard",
        }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating trainer dashboard preferences:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update dashboard preferences",
      },
      { status: 500 }
    );
  }
}

