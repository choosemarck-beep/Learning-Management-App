import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { calculateTrainingProgress, updateCourseProgress } from "@/lib/utils/trainingProgress";

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

    // Fetch training to get minimum watch time
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      select: {
        minimumWatchTime: true,
        videoDuration: true,
      },
    });

    if (!training) {
      return NextResponse.json(
        { success: false, error: "Training not found" },
        { status: 404 }
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
      },
      update: {},
    });

    const minimumWatchTime = training.minimumWatchTime || 0;
    const canTakeQuiz =
      trainingProgress.videoWatchedSeconds >= minimumWatchTime;

    return NextResponse.json(
      {
        success: true,
        data: {
          watchedSeconds: trainingProgress.videoWatchedSeconds,
          videoProgress: trainingProgress.videoProgress,
          canTakeQuiz,
          minimumWatchTime,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching watch progress:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch watch progress",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ trainingId: string }> }
) {
  try {
    // Await params in Next.js 14+ App Router
    let trainingId: string;
    try {
      const resolvedParams = await params;
      trainingId = resolvedParams.trainingId;
      if (!trainingId || typeof trainingId !== 'string') {
        return NextResponse.json(
          { success: false, error: "Invalid training ID" },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("Error resolving params:", error);
      return NextResponse.json(
        { success: false, error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    let user;
    try {
      user = await getCurrentUser();
    } catch (error) {
      console.error("Error getting current user:", error);
      return NextResponse.json(
        { success: false, error: "Authentication error" },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }
    
    const { watchedSeconds, isPlaying } = body;

    if (typeof watchedSeconds !== "number" || watchedSeconds < 0 || !isFinite(watchedSeconds)) {
      return NextResponse.json(
        { success: false, error: "Invalid watchedSeconds" },
        { status: 400 }
      );
    }

    // Fetch training to get video duration and minimum watch time
    let training;
    try {
      training = await prisma.training.findUnique({
        where: { id: trainingId },
        select: {
          videoDuration: true,
          minimumWatchTime: true,
          quiz: {
            select: {
              id: true,
            },
          },
          miniTrainings: {
            select: {
              id: true,
              videoDuration: true,
              miniQuiz: {
                select: {
                  id: true,
                },
              },
            },
          },
          course: {
            select: {
              id: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error fetching training:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch training" },
        { status: 500 }
      );
    }

    if (!training) {
      return NextResponse.json(
        { success: false, error: "Training not found" },
        { status: 404 }
      );
    }

    // Calculate if video is completed (watched at least 90% of duration)
    const videoDuration = training.videoDuration || 0;
    const isVideoCompleted =
      videoDuration > 0 && watchedSeconds >= videoDuration * 0.9;

    // Calculate video progress percentage
    const videoProgress = videoDuration > 0 
      ? Math.min((watchedSeconds / videoDuration) * 100, 100)
      : 0;
    
    // Ensure videoProgress is a valid number
    if (isNaN(videoProgress) || !isFinite(videoProgress)) {
      console.error("Invalid videoProgress calculated:", { watchedSeconds, videoDuration, videoProgress });
      return NextResponse.json(
        { success: false, error: "Invalid progress calculation" },
        { status: 400 }
      );
    }

    // Get or create training progress
    // Note: findUnique shouldn't fail - if progress doesn't exist, it returns null
    // We only need this to check if progress exists, but upsert will handle creation/update
    let existingProgress = null;
    try {
      existingProgress = await prisma.trainingProgressNew.findUnique({
        where: {
          userId_trainingId: {
            userId: user.id,
            trainingId: trainingId,
          },
        },
      });
    } catch (error) {
      // Log error but don't fail - upsert will handle it
      console.error("Error fetching existing progress (non-fatal):", error);
      // Continue - upsert will create if it doesn't exist
    }

    const totalMiniTrainings = training.miniTrainings.length;

    // Update or create training progress
    let trainingProgress;
    try {
      const videoWatchedSecondsInt = Math.floor(watchedSeconds);
      
      // Validate all values before database operation
      if (isNaN(videoWatchedSecondsInt) || !isFinite(videoWatchedSecondsInt) || videoWatchedSecondsInt < 0) {
        console.error("Invalid videoWatchedSeconds:", watchedSeconds, "->", videoWatchedSecondsInt);
        return NextResponse.json(
          { success: false, error: "Invalid watched seconds value" },
          { status: 400 }
        );
      }
      
      if (isNaN(videoProgress) || !isFinite(videoProgress) || videoProgress < 0 || videoProgress > 100) {
        console.error("Invalid videoProgress:", videoProgress);
        return NextResponse.json(
          { success: false, error: "Invalid video progress value" },
          { status: 400 }
        );
      }

      trainingProgress = await prisma.trainingProgressNew.upsert({
        where: {
          userId_trainingId: {
            userId: user.id,
            trainingId: trainingId,
          },
        },
        create: {
          userId: user.id,
          trainingId: trainingId,
          videoProgress: videoProgress,
          videoWatchedSeconds: videoWatchedSecondsInt,
          quizCompleted: false,
          quizPostponed: false, // Explicitly set to avoid schema mismatch
          miniTrainingsCompleted: 0,
          totalMiniTrainings: totalMiniTrainings,
          progress: 0,
          isCompleted: false,
        },
        update: {
          videoProgress: videoProgress,
          videoWatchedSeconds: videoWatchedSecondsInt,
          // Don't update totalMiniTrainings - it's set when progress is created and shouldn't change
        },
      });
    } catch (error) {
      console.error("Error upserting training progress:", error);
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      // Log the data that caused the error for debugging
      console.error("Error context:", {
        userId: user.id,
        trainingId: trainingId,
        watchedSeconds: watchedSeconds,
        videoProgress: videoProgress,
        totalMiniTrainings: totalMiniTrainings,
      });
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to save progress",
          details: process.env.NODE_ENV === 'development' 
            ? (error instanceof Error ? error.message : String(error))
            : undefined,
        },
        { status: 500 }
      );
    }

    // Fetch detailed mini-training progress for accurate 70/30 calculation
    let miniTrainingsCompleted = 0;
    let detailedMiniProgresses: Array<{
      videoProgress: number;
      quizCompleted: boolean;
      hasVideo: boolean;
      hasQuiz: boolean;
    }> = [];

    if (training.miniTrainings.length > 0) {
      try {
        const miniTrainingProgresses = await prisma.miniTrainingProgress.findMany({
          where: {
            userId: user.id,
            miniTrainingId: {
              in: training.miniTrainings.map((mt) => mt.id),
            },
          },
        });

        // Count completed mini-trainings
        miniTrainingsCompleted = miniTrainingProgresses.filter(
          (p) => p.isCompleted
        ).length;

        // Map to detailed format for 70/30 calculation
        detailedMiniProgresses = training.miniTrainings.map((mt) => {
          const mtProgress = miniTrainingProgresses.find(
            (p) => p.miniTrainingId === mt.id
          );
          return {
            videoProgress: mtProgress?.videoProgress || 0,
            quizCompleted: mtProgress?.quizCompleted || false,
            hasVideo: !!mt.videoDuration && mt.videoDuration > 0,
            hasQuiz: !!mt.miniQuiz,
          };
        });
      } catch (error) {
        console.error("Error fetching mini-training progress:", error);
        // Fall back to stored value if query fails
        miniTrainingsCompleted = trainingProgress.miniTrainingsCompleted;
      }
    }

    // Recalculate overall training progress with fresh mini-trainings data
    let overallProgress;
    try {
      overallProgress = await calculateTrainingProgress(
        {
          videoProgress: trainingProgress.videoProgress,
          quizCompleted: trainingProgress.quizCompleted,
          miniTrainingsCompleted: miniTrainingsCompleted,
          totalMiniTrainings: training.miniTrainings.length,
          miniTrainingProgresses: detailedMiniProgresses,
        },
        {
          videoDuration: training.videoDuration,
          quiz: training.quiz ? { id: training.quiz.id } : null,
          miniTrainings: training.miniTrainings.map((mt) => ({
            id: mt.id,
            videoDuration: mt.videoDuration,
            miniQuiz: mt.miniQuiz ? { id: mt.miniQuiz.id } : null,
          })),
        }
      );
    } catch (error) {
      console.error("Error calculating training progress:", error);
      // If progress calculation fails, use current progress values
      overallProgress = {
        progress: trainingProgress.progress,
        isCompleted: trainingProgress.isCompleted,
      };
    }

    // Update progress and mini-trainings count if they changed
    const progressChanged = overallProgress.progress !== trainingProgress.progress;
    const miniTrainingsCountChanged = miniTrainingsCompleted !== trainingProgress.miniTrainingsCompleted;
    const totalMiniTrainingsChanged = training.miniTrainings.length !== trainingProgress.totalMiniTrainings;

    if (progressChanged || miniTrainingsCountChanged || totalMiniTrainingsChanged) {
      try {
        await prisma.trainingProgressNew.update({
          where: {
            userId_trainingId: {
              userId: user.id,
              trainingId: trainingId,
            },
          },
          data: {
            progress: overallProgress.progress,
            isCompleted: overallProgress.isCompleted,
            miniTrainingsCompleted: miniTrainingsCompleted,
            totalMiniTrainings: training.miniTrainings.length,
            completedAt: overallProgress.isCompleted && !trainingProgress.completedAt
              ? new Date()
              : trainingProgress.completedAt,
          },
        });

        // Recalculate course progress if training is completed
        if (overallProgress.isCompleted && training.course) {
          try {
            await updateCourseProgress(user.id, training.course.id);
          } catch (error) {
            console.error("Error updating course progress:", error);
            // Don't fail the request if course progress update fails
          }
        }
      } catch (error) {
        console.error("Error updating training progress:", error);
        // Don't fail the request if progress update fails - the watch position is already saved
      }
    }

    const minimumWatchTime = training.minimumWatchTime || 0;
    const canTakeQuiz = watchedSeconds >= minimumWatchTime;

    return NextResponse.json(
      {
        success: true,
        data: {
          watchedSeconds,
          videoProgress,
          isVideoCompleted,
          canTakeQuiz,
          minimumWatchTime,
          progress: overallProgress.progress,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating watch progress:", error);
    // Log more details for debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update watch progress",
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}


