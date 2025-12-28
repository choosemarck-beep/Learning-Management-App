import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

// POST - Save or clear "Take it later" choice for quiz
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trainingId: string }> }
) {
  try {
    const { trainingId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { postponed } = body;

    if (typeof postponed !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Get or create training progress
    const trainingProgress = await prisma.trainingProgressNew.upsert({
      where: {
        userId_trainingId: {
          userId: user.id,
          trainingId: trainingId,
        },
      },
      create: {
        userId: user.id,
        trainingId: trainingId,
        videoProgress: 0,
        videoWatchedSeconds: 0,
        quizCompleted: false,
        miniTrainingsCompleted: 0,
        totalMiniTrainings: 0,
        progress: 0,
        isCompleted: false,
        quizPostponed: postponed,
      },
      update: {
        quizPostponed: postponed,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { quizPostponed: trainingProgress.quizPostponed },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving quiz postpone status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save quiz postpone status",
      },
      { status: 500 }
    );
  }
}

