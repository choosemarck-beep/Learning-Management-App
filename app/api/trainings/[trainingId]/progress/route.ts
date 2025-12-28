import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { calculateTrainingProgress } from "@/lib/utils/trainingProgress";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trainingId: string }> }
) {
  try {
    // Await params in Next.js 14+ App Router
    const { trainingId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch training
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        quiz: {
          select: {
            id: true,
          },
        },
        miniTrainings: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!training) {
      return NextResponse.json(
        { success: false, error: "Training not found" },
        { status: 404 }
      );
    }

    // Get or create training progress
    let trainingProgress = await prisma.trainingProgressNew.findUnique({
      where: {
        userId_trainingId: {
          userId: user.id,
          trainingId: trainingId,
        },
      },
    });

    if (!trainingProgress) {
      trainingProgress = await prisma.trainingProgressNew.create({
        data: {
          userId: user.id,
          trainingId: trainingId,
          videoProgress: 0,
          videoWatchedSeconds: 0,
          quizCompleted: false,
          miniTrainingsCompleted: 0,
          totalMiniTrainings: training.miniTrainings.length,
          progress: 0,
          isCompleted: false,
        },
      });
    }

    // Recalculate progress
    const calculatedProgress = await calculateTrainingProgress(
      {
        videoProgress: trainingProgress.videoProgress,
        quizCompleted: trainingProgress.quizCompleted,
        miniTrainingsCompleted: trainingProgress.miniTrainingsCompleted,
        totalMiniTrainings: trainingProgress.totalMiniTrainings,
      },
      {
        videoDuration: training.videoDuration,
        quiz: training.quiz ? { id: training.quiz.id } : null,
        miniTrainings: training.miniTrainings,
      }
    );

    // Update if different
    if (calculatedProgress.progress !== trainingProgress.progress) {
      trainingProgress = await prisma.trainingProgressNew.update({
        where: {
          userId_trainingId: {
            userId: user.id,
            trainingId: trainingId,
          },
        },
        data: {
          progress: calculatedProgress.progress,
          isCompleted: calculatedProgress.isCompleted,
          completedAt: calculatedProgress.isCompleted && !trainingProgress.completedAt
            ? new Date()
            : trainingProgress.completedAt,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          progress: trainingProgress.progress,
          isCompleted: trainingProgress.isCompleted,
          videoProgress: trainingProgress.videoProgress,
          quizCompleted: trainingProgress.quizCompleted,
          miniTrainingsCompleted: trainingProgress.miniTrainingsCompleted,
          totalMiniTrainings: trainingProgress.totalMiniTrainings,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching training progress:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch training progress",
      },
      { status: 500 }
    );
  }
}


