import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { randomizeQuizQuestions } from "@/lib/utils/quizRandomization";
import { awardTrainingXP } from "@/lib/utils/trainingProgress";

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
    const { answers, timeSpent, startedAt } = body;

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { success: false, error: "Answers are required" },
        { status: 400 }
      );
    }

    // Fetch mini-training and mini-quiz
    const miniTraining = await prisma.miniTraining.findUnique({
      where: { id: miniTrainingId },
      include: {
        miniQuiz: true,
        training: {
          select: {
            id: true,
            courseId: true,
            totalXP: true, // Needed for XP calculation
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

    if (!miniTraining.miniQuiz) {
      return NextResponse.json(
        { success: false, error: "No quiz available for this mini-training" },
        { status: 404 }
      );
    }

    // Get attempt number for randomization
    const existingAttempts = await prisma.miniQuizAttempt.findMany({
      where: {
        userId: user.id,
        miniQuizId: miniTraining.miniQuiz.id,
      },
      orderBy: {
        completedAt: "desc",
      },
    });
    const attemptNumber = existingAttempts.length + 1;

    // Parse quiz questions
    let questions;
    try {
      questions = JSON.parse(miniTraining.miniQuiz.questions || "[]");
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid quiz format" },
        { status: 400 }
      );
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Quiz has no questions" },
        { status: 400 }
      );
    }

    // Normalize question options format
    questions = questions.map((question: any) => {
      if (question.options && Array.isArray(question.options)) {
        const normalizedOptions = question.options.map((option: any, index: number) => {
          if (typeof option === 'string') {
            return {
              id: `opt-${question.id || `q-${index}`}-${index}`,
              text: option,
            };
          } else {
            return {
              id: option.id || `opt-${question.id || `q-${index}`}-${index}`,
              text: option.text || String(option),
            };
          }
        });
        return {
          ...question,
          options: normalizedOptions,
        };
      }
      return question;
    });

    // ALWAYS apply randomization to prevent cheating and memorization
    if (questions.length > 0) {
      const randomized = randomizeQuizQuestions(
        questions,
        miniTraining.miniQuiz.questionsToShow, // Can be null (show all) - still randomizes order
        user.id,
        attemptNumber
      );
      // Convert randomized questions to format expected by scoring logic
      questions = randomized.map((q: { id: string; type: string; question: string; options: Array<{ id: string; text: string }>; correctAnswer: number | string; points: number; explanation?: string }) => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options.map((opt: { id: string; text: string }) => ({
          id: opt.id,
          text: opt.text,
        })),
        correctAnswer: q.correctAnswer, // This is the new randomized index
        points: q.points,
        explanation: q.explanation,
      }));
    }

    // Calculate score
    let correctAnswers = 0;
    const results = questions.map((question: any) => {
      const userAnswer = answers[question.id];

      // Find correct option
      let correctOption;
      if (typeof question.correctAnswer === "number") {
        correctOption = question.options?.[question.correctAnswer];
      } else {
        correctOption = question.options?.find(
          (opt: any) => opt.isCorrect === true || opt.id === question.correctAnswer
        );
      }

      // Check if answer is correct
      let isCorrect = false;
      if (typeof question.correctAnswer === "number") {
        const selectedOption = question.options?.find(
          (opt: any) => opt.id === userAnswer
        );
        const selectedIndex = question.options?.findIndex(
          (opt: any) => opt.id === userAnswer
        );
        isCorrect = selectedIndex === question.correctAnswer;
      } else {
        isCorrect = userAnswer === correctOption?.id || userAnswer === question.correctAnswer;
      }

      if (isCorrect) {
        correctAnswers++;
      }

      // Get user's selected option text for display
      let userAnswerText = userAnswer;
      if (userAnswer && question.options) {
        const userOption = question.options.find((opt: any) => {
          if (typeof opt === 'string') {
            return false; // Can't match by ID for string options
          }
          return opt.id === userAnswer;
        });
        
        if (userOption) {
          userAnswerText = typeof userOption === 'string' 
            ? userOption 
            : (userOption.text || String(userOption));
        } else {
          // Try to find by index if userAnswer is an ID pattern
          const optionIndex = question.options.findIndex((opt: any, idx: number) => {
            if (typeof opt === 'string') {
              return false;
            }
            return opt.id === userAnswer;
          });
          
          if (optionIndex >= 0) {
            const opt = question.options[optionIndex];
            userAnswerText = typeof opt === 'string' ? opt : (opt.text || String(opt));
          }
        }
      }

      // Get correct answer text for display
      let correctAnswerText = question.correctAnswer;
      if (correctOption) {
        correctAnswerText = typeof correctOption === 'string'
          ? correctOption
          : (correctOption.text || String(correctOption));
      } else if (typeof question.correctAnswer === 'number' && question.options) {
        // Index-based answer
        const correctOpt = question.options[question.correctAnswer];
        if (correctOpt) {
          correctAnswerText = typeof correctOpt === 'string'
            ? correctOpt
            : (correctOpt.text || String(correctOpt));
        }
      }

      return {
        questionId: question.id,
        question: question.question,
        userAnswer: userAnswerText, // Return text instead of ID
        correctAnswer: correctOption?.id || correctOption?.text || question.correctAnswer,
        correctAnswerText: correctAnswerText,
        isCorrect,
        options: question.options,
        explanation: question.explanation,
      };
    });

    const totalQuestions = questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = score >= miniTraining.miniQuiz.passingScore;

    // Calculate duration
    const completedAt = new Date();
    let calculatedTimeSpent: number | null = null;
    let startedAtDate: Date | null = null;

    if (startedAt) {
      // Parse startedAt (can be ISO string or timestamp)
      startedAtDate = typeof startedAt === 'string' 
        ? new Date(startedAt) 
        : new Date(startedAt);
      
      // Calculate duration in seconds
      if (!isNaN(startedAtDate.getTime())) {
        calculatedTimeSpent = Math.floor((completedAt.getTime() - startedAtDate.getTime()) / 1000);
      }
    }

    // Use calculated time if available, otherwise use provided timeSpent
    const finalTimeSpent = calculatedTimeSpent !== null ? calculatedTimeSpent : (timeSpent || null);

    // Create mini-quiz attempt
    const miniQuizAttempt = await prisma.miniQuizAttempt.create({
      data: {
        userId: user.id,
        miniQuizId: miniTraining.miniQuiz.id,
        score: score,
        answers: JSON.stringify(answers),
        timeSpent: finalTimeSpent,
        startedAt: startedAtDate,
        completedAt: completedAt,
        passed: passed,
      },
    });

    // Update mini-training progress
    const miniTrainingProgress = await prisma.miniTrainingProgress.upsert({
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
        quizCompleted: passed,
        quizScore: score,
        isCompleted: passed, // Completed if quiz passed
      },
      update: {
        quizCompleted: passed,
        quizScore: score,
        isCompleted: passed,
        completedAt: passed ? new Date() : undefined,
      },
    });

    // Recalculate parent training progress
    await recalculateTrainingProgress(user.id, miniTraining.training.id);

    // Award XP if mini-training is completed (quiz passed)
    // Use a portion of parent training's totalXP (e.g., 20% since mini-trainings are 20% of training weight)
    let xpEarned = 0;
    if (passed && miniTrainingProgress.isCompleted) {
      // Calculate XP based on parent training's totalXP
      // Mini-trainings typically represent 20% of training weight, so award 20% of training XP
      const trainingTotalXP = miniTraining.training.totalXP || 0;
      const miniTrainingBaseXP = Math.round(trainingTotalXP * 0.2); // 20% of training XP
      
      xpEarned = await awardTrainingXP(
        user.id,
        { totalXP: miniTrainingBaseXP },
        score,
        passed
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          score,
          correctAnswers,
          totalQuestions,
          passed,
          results,
          isCompleted: miniTrainingProgress.isCompleted,
          xpEarned,
          startedAt: miniQuizAttempt?.startedAt || null,
          completedAt: miniQuizAttempt?.completedAt || null,
          timeSpent: miniQuizAttempt?.timeSpent || null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error submitting mini-training quiz:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit mini-training quiz",
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

