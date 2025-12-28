import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

// GET - Fetch all mandatory trainings with user progress
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all active mandatory trainings
    const trainings = await prisma.mandatoryTraining.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        badgeIcon: true,
        badgeColor: true,
      },
    });

    // Fetch user's progress for each training
    const userProgress = await prisma.trainingProgress.findMany({
      where: {
        userId: currentUser.id,
      },
      select: {
        trainingId: true,
        progress: true,
        isCompleted: true,
      },
    });

    // Map progress to trainings
    const trainingsWithProgress = trainings.map((training) => {
      const progress = userProgress.find((p) => p.trainingId === training.id);
      return {
        ...training,
        progress: progress?.progress || 0,
        isCompleted: progress?.isCompleted || false,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: { trainings: trainingsWithProgress },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching training passport:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch training passport",
      },
      { status: 500 }
    );
  }
}

