import { prisma } from "@/lib/prisma/client";
import { GAMIFICATION } from "@/lib/constants/gamification";
import { updateGamificationStats } from "@/lib/utils/gamification";

/**
 * Calculate training progress based on video, quiz, and mini-trainings
 * Uses dynamic priority-based weights that always sum to 100%
 * Priority: Video (highest) > Quiz > Mini-trainings (lowest)
 * 
 * Mini-training internal weights: 70% video, 30% quiz per mini-training
 */
export async function calculateTrainingProgress(
  progress: {
    videoProgress: number;
    quizCompleted: boolean;
    miniTrainingsCompleted: number;
    totalMiniTrainings: number;
    // Optional: detailed mini-training progress for accurate 70/30 calculation
    miniTrainingProgresses?: Array<{
      videoProgress: number;
      quizCompleted: boolean;
      hasVideo: boolean;
      hasQuiz: boolean;
    }>;
  },
  training: {
    videoDuration: number | null;
    quiz: { id: string } | null;
    miniTrainings: Array<{
      id: string;
      videoDuration?: number | null;
      miniQuiz?: { id: string } | null;
    }> | Array<{ id: string }>; // Flexible to handle existing call sites
  }
): Promise<{ progress: number; isCompleted: boolean }> {
  // Input validation and sanitization
  const videoProgress = Math.max(0, Math.min(100, progress.videoProgress || 0));
  const quizCompleted = Boolean(progress.quizCompleted);
  const miniTrainingsCompleted = Math.max(0, Math.floor(progress.miniTrainingsCompleted || 0));
  const totalMiniTrainings = Math.max(0, Math.floor(progress.totalMiniTrainings || 0));
  
  // Validate mini-trainings count consistency
  if (miniTrainingsCompleted > totalMiniTrainings) {
    console.warn(
      `[calculateTrainingProgress] Invalid mini-trainings count: completed (${miniTrainingsCompleted}) > total (${totalMiniTrainings}). Clamping to total.`
    );
  }
  const validMiniTrainingsCompleted = Math.min(miniTrainingsCompleted, totalMiniTrainings);

  const hasVideo = !!training.videoDuration && training.videoDuration > 0;
  const hasQuiz = !!training.quiz;
  const hasMiniTrainings = training.miniTrainings.length > 0;

  // If no components, default to 0
  if (!hasVideo && !hasQuiz && !hasMiniTrainings) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[calculateTrainingProgress] No training components found, returning 0% progress');
    }
    return { progress: 0, isCompleted: false };
  }

  // Calculate dynamic weights based on priority and available components
  let videoWeight = 0;
  let quizWeight = 0;
  let miniTrainingsWeight = 0;

  // Priority-based weight distribution
  if (hasVideo && hasQuiz && hasMiniTrainings) {
    // All three: Video = 50%, Quiz = 30%, Mini-trainings = 20%
    videoWeight = 0.5;
    quizWeight = 0.3;
    miniTrainingsWeight = 0.2;
  } else if (hasVideo && hasQuiz) {
    // Video + Quiz: 50% each
    videoWeight = 0.5;
    quizWeight = 0.5;
  } else if (hasVideo && hasMiniTrainings) {
    // Video + Mini-trainings: 60% Video, 40% Mini-trainings
    videoWeight = 0.6;
    miniTrainingsWeight = 0.4;
  } else if (hasQuiz && hasMiniTrainings) {
    // Quiz + Mini-trainings: 60% Quiz, 40% Mini-trainings
    quizWeight = 0.6;
    miniTrainingsWeight = 0.4;
  } else if (hasVideo) {
    // Only Video: 100%
    videoWeight = 1.0;
  } else if (hasQuiz) {
    // Only Quiz: 100%
    quizWeight = 1.0;
  } else if (hasMiniTrainings) {
    // Only Mini-trainings: 100%
    miniTrainingsWeight = 1.0;
  }

  // Calculate weighted progress
  let weightedProgress = 0;

  // Video progress
  if (hasVideo && videoWeight > 0) {
    weightedProgress += videoProgress * videoWeight;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[calculateTrainingProgress] Video progress: ${videoProgress}% × ${(videoWeight * 100).toFixed(0)}% = ${(videoProgress * videoWeight).toFixed(2)}%`);
    }
  }

  // Quiz completion
  if (hasQuiz && quizWeight > 0) {
    if (quizCompleted) {
      weightedProgress += 100 * quizWeight;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[calculateTrainingProgress] Quiz completed: 100% × ${(quizWeight * 100).toFixed(0)}% = ${(100 * quizWeight).toFixed(2)}%`);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[calculateTrainingProgress] Quiz not completed: 0% × ${(quizWeight * 100).toFixed(0)}% = 0%`);
      }
    }
  }

  // Mini-trainings completion with internal 70/30 video/quiz split
  if (hasMiniTrainings && miniTrainingsWeight > 0 && totalMiniTrainings > 0) {
    let miniTrainingProgress = 0;

    if (progress.miniTrainingProgresses && progress.miniTrainingProgresses.length > 0) {
      // Calculate detailed progress using 70/30 split per mini-training
      const miniTrainingProgresses = progress.miniTrainingProgresses;
      let totalMiniProgress = 0;
      let validMiniTrainings = 0;

      for (const mtProgress of miniTrainingProgresses) {
        // Validate and sanitize mini-training progress
        const mtVideoProgress = Math.max(0, Math.min(100, mtProgress.videoProgress || 0));
        const mtQuizCompleted = Boolean(mtProgress.quizCompleted);
        
        let mtWeightedProgress = 0;
        let mtTotalWeight = 0;

        // Video portion (70% of mini-training weight)
        if (mtProgress.hasVideo) {
          mtWeightedProgress += mtVideoProgress * 0.7;
          mtTotalWeight += 0.7;
        }

        // Quiz portion (30% of mini-training weight)
        if (mtProgress.hasQuiz) {
          if (mtQuizCompleted) {
            mtWeightedProgress += 100 * 0.3;
          }
          mtTotalWeight += 0.3;
        }

        // Normalize this mini-training's progress
        const mtProgressNormalized = mtTotalWeight > 0 
          ? mtWeightedProgress / mtTotalWeight 
          : 0;
        totalMiniProgress += mtProgressNormalized;
        validMiniTrainings++;
      }

      // Average all mini-trainings (use valid count to avoid division by zero)
      miniTrainingProgress = validMiniTrainings > 0
        ? totalMiniProgress / validMiniTrainings
        : 0;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[calculateTrainingProgress] Mini-trainings detailed progress: ${miniTrainingProgress.toFixed(2)}% (${validMiniTrainings}/${totalMiniTrainings} valid)`);
      }
    } else {
      // Fallback to simple count-based if detailed progress not provided
      miniTrainingProgress = (validMiniTrainingsCompleted / totalMiniTrainings) * 100;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[calculateTrainingProgress] Mini-trainings count-based progress: ${validMiniTrainingsCompleted}/${totalMiniTrainings} = ${miniTrainingProgress.toFixed(2)}%`);
      }
    }

    weightedProgress += miniTrainingProgress * miniTrainingsWeight;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[calculateTrainingProgress] Mini-trainings weighted: ${miniTrainingProgress.toFixed(2)}% × ${(miniTrainingsWeight * 100).toFixed(0)}% = ${(miniTrainingProgress * miniTrainingsWeight).toFixed(2)}%`);
    }
  }

  // Ensure progress never exceeds 100% (weights should sum to 1.0, but add safety check)
  const finalProgress = Math.max(0, Math.min(100, Math.round(weightedProgress * 100) / 100));
  const isCompleted = finalProgress >= 100;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[calculateTrainingProgress] Final progress: ${finalProgress.toFixed(2)}% (completed: ${isCompleted})`);
  }

  return {
    progress: finalProgress,
    isCompleted: isCompleted,
  };
}

/**
 * Calculate course progress based on completed trainings
 */
export async function calculateCourseProgress(
  userId: string,
  courseId: string
): Promise<{ progress: number; isCompleted: boolean; completedTrainings: number; totalTrainings: number }> {
  try {
    // Get all published trainings in course
    const trainings = await prisma.training.findMany({
      where: {
        courseId: courseId,
        isPublished: true,
      },
      select: {
        id: true,
      },
    });

    if (trainings.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[calculateCourseProgress] No published trainings found for course ${courseId}`);
      }
      return {
        progress: 0,
        isCompleted: false,
        completedTrainings: 0,
        totalTrainings: 0,
      };
    }

    // Get user's progress for all trainings
    const trainingProgresses = await prisma.trainingProgressNew.findMany({
      where: {
        userId: userId,
        trainingId: {
          in: trainings.map((t) => t.id),
        },
      },
    });

    // Calculate course progress
    const completedTrainings = trainingProgresses.filter((tp) => tp.isCompleted).length;
    const totalTrainings = trainings.length;
    const courseProgress = totalTrainings > 0
      ? (completedTrainings / totalTrainings) * 100
      : 0;
    
    // Ensure progress is between 0 and 100
    const validatedProgress = Math.max(0, Math.min(100, Math.round(courseProgress * 100) / 100));
    const isCompleted = validatedProgress >= 100;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[calculateCourseProgress] Course ${courseId}: ${completedTrainings}/${totalTrainings} trainings completed = ${validatedProgress.toFixed(2)}%`);
    }

    return {
      progress: validatedProgress,
      isCompleted,
      completedTrainings,
      totalTrainings,
    };
  } catch (error) {
    console.error(`[calculateCourseProgress] Error calculating course progress for course ${courseId}:`, error);
    // Return safe defaults on error
    return {
      progress: 0,
      isCompleted: false,
      completedTrainings: 0,
      totalTrainings: 0,
    };
  }
}

/**
 * Award XP for training completion
 */
export async function awardTrainingXP(
  userId: string,
  training: {
    totalXP: number;
  },
  quizScore: number | null,
  passed: boolean
): Promise<number> {
  // Calculate XP based on training totalXP and quiz score
  const baseXP = training.totalXP || 0;
  const scoreMultiplier = passed && quizScore !== null ? quizScore / 100 : 0.5; // 50% if failed or no quiz
  const xpEarned = Math.round(baseXP * scoreMultiplier);

  if (xpEarned > 0) {
    // Get current XP
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true },
    });

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Calculate new total XP
    const newTotalXP = currentUser.xp + xpEarned;

    // Update all gamification stats (XP, level, rank, diamonds)
    await updateGamificationStats(userId, newTotalXP);
  }

  return xpEarned;
}

/**
 * Update course progress in database
 */
export async function updateCourseProgress(
  userId: string,
  courseId: string
): Promise<void> {
  try {
    const calculated = await calculateCourseProgress(userId, courseId);

    // Validate calculated progress before saving
    if (calculated.progress < 0 || calculated.progress > 100) {
      console.error(
        `[updateCourseProgress] Invalid progress value: ${calculated.progress}. Clamping to valid range.`
      );
      calculated.progress = Math.max(0, Math.min(100, calculated.progress));
    }

    // Update or create course progress (auto-enrollment)
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
        progress: calculated.progress,
        isCompleted: calculated.isCompleted,
      },
      update: {
        progress: calculated.progress,
        isCompleted: calculated.isCompleted,
      },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[updateCourseProgress] Updated course progress for user ${userId}, course ${courseId}: ${calculated.progress.toFixed(2)}% (completed: ${calculated.isCompleted})`
      );
    }
  } catch (error) {
    console.error(
      `[updateCourseProgress] Error updating course progress for user ${userId}, course ${courseId}:`,
      error
    );
    throw error; // Re-throw to allow callers to handle
  }
}

/**
 * Recalculate training progress for all users who have started the training
 * Called when training content is added/removed (quiz, mini-training, mini-quiz)
 * 
 * @param trainingId - The training ID to recalculate progress for
 * @returns Array of user IDs whose completion status was affected (was 100%, now < 100%)
 */
export async function recalculateTrainingProgressForAllUsers(
  trainingId: string
): Promise<string[]> {
  try {
    // Fetch training with all components
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        quiz: {
          select: {
            id: true,
          },
        },
        miniTrainings: {
          include: {
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

    if (!training) {
      console.error(`Training ${trainingId} not found`);
      return [];
    }

    // Get all users who have progress for this training
    const allProgresses = await prisma.trainingProgressNew.findMany({
      where: {
        trainingId: trainingId,
      },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    const affectedUserIds: string[] = [];

    // Recalculate progress for each user
    for (const userProgress of allProgresses) {
      const wasCompleted = userProgress.isCompleted;

      // Fetch detailed mini-training progresses for this user
      const miniTrainingProgresses = await prisma.miniTrainingProgress.findMany({
        where: {
          userId: userProgress.userId,
          miniTrainingId: {
            in: training.miniTrainings.map((mt) => mt.id),
          },
        },
      });

      // Map mini-training progress to detailed format
      const detailedMiniProgresses = training.miniTrainings.map((mt) => {
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

      // Count completed mini-trainings (for backward compatibility)
      const miniTrainingsCompleted = miniTrainingProgresses.filter(
        (p) => p.isCompleted
      ).length;

      // Recalculate progress with new weights
      const newProgress = await calculateTrainingProgress(
        {
          videoProgress: userProgress.videoProgress,
          quizCompleted: userProgress.quizCompleted,
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

      // Update progress in database
      await prisma.trainingProgressNew.update({
        where: {
          userId_trainingId: {
            userId: userProgress.userId,
            trainingId: trainingId,
          },
        },
        data: {
          progress: newProgress.progress,
          isCompleted: newProgress.isCompleted,
          miniTrainingsCompleted: miniTrainingsCompleted,
          totalMiniTrainings: training.miniTrainings.length,
          // Clear completedAt if no longer completed
          completedAt:
            newProgress.isCompleted && !wasCompleted
              ? new Date()
              : newProgress.isCompleted
              ? userProgress.completedAt
              : null,
        },
      });

      // Check if completion status was affected (was 100%, now < 100%)
      if (wasCompleted && !newProgress.isCompleted) {
        affectedUserIds.push(userProgress.userId);
      }

      // Recalculate course progress if training completion changed
      if (training.course && (wasCompleted !== newProgress.isCompleted)) {
        try {
          await updateCourseProgress(userProgress.userId, training.course.id);
        } catch (error) {
          console.error(
            `Error updating course progress for user ${userProgress.userId}:`,
            error
          );
        }
      }
    }

    return affectedUserIds;
  } catch (error) {
    console.error(
      `Error recalculating training progress for all users:`,
      error
    );
    return [];
  }
}

