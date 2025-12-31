import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ miniTrainingId: string }> }
) {
  try {
    // Await params in Next.js 14+ App Router
    const { miniTrainingId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch mini-training
    const miniTraining = await prisma.miniTraining.findUnique({
      where: { id: miniTrainingId },
      select: {
        videoDuration: true,
      },
    });

    if (!miniTraining) {
      return NextResponse.json(
        { success: false, error: "Mini-training not found" },
        { status: 404 }
      );
    }

    // Get or create mini-training progress
    const progress = await prisma.miniTrainingProgress.upsert({
      where: {
        userId_miniTrainingId: {
          userId: user.id,
          miniTrainingId: miniTrainingId,
        },
      },
      create: {
        userId: user.id,
        miniTrainingId: miniTrainingId,
        videoProgress: 0,
        quizCompleted: false,
        isCompleted: false,
      },
      update: {},
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          videoProgress: progress.videoProgress,
          quizCompleted: progress.quizCompleted,
          isCompleted: progress.isCompleted,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching mini-training progress:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch mini-training progress",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ miniTrainingId: string }> }
) {
  try {
    // Await params in Next.js 14+ App Router
    const { miniTrainingId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { watchedSeconds, isPlaying } = body;

    if (typeof watchedSeconds !== "number" || watchedSeconds < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid watchedSeconds" },
        { status: 400 }
      );
    }

    // Fetch mini-training
    const miniTraining = await prisma.miniTraining.findUnique({
      where: { id: miniTrainingId },
      include: {
        training: {
          select: {
            id: true,
            courseId: true,
          },
        },
      },
    });

    if (!miniTraining) {
      return NextResponse.json(
        { success: false, error: "Mini-training not found" },
        { status: 404 }
      );
    }

    // Calculate video progress percentage
    const videoDuration = miniTraining.videoDuration || 0;
    const videoProgress = videoDuration > 0
      ? Math.min((watchedSeconds / videoDuration) * 100, 100)
      : 0;

    // Get existing progress to check quiz status
    const existingProgress = await prisma.miniTrainingProgress.findUnique({
      where: {
        userId_miniTrainingId: {
          userId: user.id,
          miniTrainingId: miniTrainingId,
        },
      },
    });

    // Always save watch position for resume functionality (like main training)
    // But only use videoProgress for progress calculation if quiz is passed
    // Use upsert to create progress if it doesn't exist
    const progress = await prisma.miniTrainingProgress.upsert({
      where: {
        userId_miniTrainingId: {
          userId: user.id,
          miniTrainingId: miniTrainingId,
        },
      },
      create: {
        userId: user.id,
        miniTrainingId: miniTrainingId,
        videoProgress: videoProgress, // Always save for resume calculation
        quizCompleted: false,
        isCompleted: false,
      },
      update: {
        // Always update videoProgress for resume functionality
        // But it's only used for progress calculation if quiz is passed
        videoProgress: videoProgress,
        // Don't update isCompleted here - it's only set when quiz is passed in quiz/submit route
      },
    });

    // Recalculate parent training progress
    await recalculateTrainingProgress(user.id, miniTraining.training.id);

    // Calculate canTakeQuiz based on minimum watch time (50% of video duration)
    const minimumWatchTime = videoDuration > 0 ? Math.floor(videoDuration * 0.5) : 0;
    const canTakeQuiz = watchedSeconds >= minimumWatchTime;

    return NextResponse.json(
      {
        success: true,
        data: {
          watchedSeconds,
          videoProgress: videoProgress, // Always return the calculated progress (which was just saved)
          canTakeQuiz,
          isCompleted: progress.isCompleted,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating mini-training progress:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update mini-training progress",
      },
      { status: 500 }
    );
  }
}

// Helper function to recalculate training progress
async function recalculateTrainingProgress(userId: string, trainingId: string) {
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

  if (!training) return;

  const trainingProgress = await prisma.trainingProgressNew.findUnique({
    where: {
      userId_trainingId: {
        userId: userId,
        trainingId: trainingId,
      },
    },
  });

  if (!trainingProgress) return;

  // Count completed mini-trainings
  const miniTrainingProgresses = await prisma.miniTrainingProgress.findMany({
    where: {
      userId: userId,
      miniTrainingId: {
        in: training.miniTrainings.map((mt) => mt.id),
      },
      isCompleted: true,
    },
  });

  const miniTrainingsCompleted = miniTrainingProgresses.length;

  // Recalculate overall progress
  const hasVideo = !!training.videoDuration && training.videoDuration > 0;
  const hasQuiz = !!training.quiz;
  const hasMiniTrainings = training.miniTrainings.length > 0;

  let totalWeight = 0;
  let weightedProgress = 0;

  if (hasVideo) {
    weightedProgress += trainingProgress.videoProgress * 0.5;
    totalWeight += 0.5;
  }

  if (hasQuiz) {
    if (trainingProgress.quizCompleted) {
      weightedProgress += 100 * 0.3;
    }
    totalWeight += 0.3;
  }

  if (hasMiniTrainings) {
    const miniTrainingProgress =
      (miniTrainingsCompleted / training.miniTrainings.length) * 100;
    weightedProgress += miniTrainingProgress * 0.2;
    totalWeight += 0.2;
  }

  const normalizedProgress = totalWeight > 0 ? weightedProgress / totalWeight : 0;
  const isCompleted = normalizedProgress >= 100;

  // Update training progress
  await prisma.trainingProgressNew.update({
    where: {
      userId_trainingId: {
        userId: userId,
        trainingId: trainingId,
      },
    },
    data: {
      miniTrainingsCompleted: miniTrainingsCompleted,
      totalMiniTrainings: training.miniTrainings.length,
      progress: Math.round(normalizedProgress * 100) / 100,
      isCompleted: isCompleted,
      completedAt: isCompleted && !trainingProgress.completedAt
        ? new Date()
        : trainingProgress.completedAt,
    },
  });

  // Recalculate course progress if training is completed
  if (isCompleted) {
    const course = await prisma.course.findUnique({
      where: { id: training.courseId },
      select: { id: true },
    });

    if (course) {
      await recalculateCourseProgress(userId, course.id);
    }
  }
}

// Helper function to recalculate course progress
async function recalculateCourseProgress(userId: string, courseId: string) {
  const trainings = await prisma.training.findMany({
    where: {
      courseId: courseId,
      isPublished: true,
    },
    select: {
      id: true,
    },
  });

  const trainingProgresses = await prisma.trainingProgressNew.findMany({
    where: {
      userId: userId,
      trainingId: {
        in: trainings.map((t) => t.id),
      },
    },
  });

  const completedTrainings = trainingProgresses.filter((tp) => tp.isCompleted).length;
  const totalTrainings = trainings.length;
  const courseProgress = totalTrainings > 0
    ? (completedTrainings / totalTrainings) * 100
    : 0;
  const isCompleted = courseProgress >= 100;

  await prisma.courseProgress.upsert({
    where: {
      userId_courseId: {
        userId: userId,
        courseId: courseId,
      },
    },
    create: {
      userId: userId,
      courseId: courseId,
      progress: courseProgress,
      isCompleted: isCompleted,
    },
    update: {
      progress: courseProgress,
      isCompleted: isCompleted,
    },
  });
}

