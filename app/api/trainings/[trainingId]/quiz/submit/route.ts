import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { calculateTrainingProgress, awardTrainingXP, updateCourseProgress } from "@/lib/utils/trainingProgress";
import { randomizeQuizQuestions } from "@/lib/utils/quizRandomization";

export async function POST(
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

    const body = await request.json();
    const { answers, timeSpent, startedAt } = body;

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { success: false, error: "Answers are required" },
        { status: 400 }
      );
    }

    // Fetch training and quiz
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        quiz: true,
        course: {
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
      },
    });

    if (!training) {
      return NextResponse.json(
        { success: false, error: "Training not found" },
        { status: 404 }
      );
    }

    if (!training.quiz) {
      return NextResponse.json(
        { success: false, error: "No quiz available for this training" },
        { status: 404 }
      );
    }

    // Check if quiz allows retake
    const existingAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId: user.id,
        quizId: training.quiz.id,
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    if (!training.quiz.allowRetake && existingAttempts.length > 0) {
      return NextResponse.json(
        { success: false, error: "Quiz does not allow retakes" },
        { status: 400 }
      );
    }

    // Check max attempts
    if (training.quiz.maxAttempts && existingAttempts.length >= training.quiz.maxAttempts) {
      return NextResponse.json(
        { success: false, error: "Maximum attempts reached" },
        { status: 400 }
      );
    }

    // Calculate attempt number (1-based)
    const attemptNumber = existingAttempts.length + 1;

    // Parse quiz questions
    let questions;
    try {
      questions = JSON.parse(training.quiz.questions || "[]");
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
              text: option.text || option.label || String(option),
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

    // Apply same randomization as display (if questionsToShow is set)
    if (training.quiz.questionsToShow && questions.length > 0) {
      const randomized = randomizeQuizQuestions(
        questions,
        training.quiz.questionsToShow,
        user.id,
        attemptNumber
      );
      // Convert randomized questions to format expected by scoring logic
      questions = randomized.map((q) => ({
        id: q.id,
        type: q.type,
        question: q.question,
        options: q.options.map(opt => ({
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
        // Index-based answer
        correctOption = question.options?.[question.correctAnswer];
      } else {
        // ID-based answer
        correctOption = question.options?.find(
          (opt: any) => opt.isCorrect === true || opt.id === question.correctAnswer
        );
      }

      // Check if answer is correct
      let isCorrect = false;
      if (typeof question.correctAnswer === "number") {
        // For index-based, find selected option index
        const selectedOption = question.options?.find(
          (opt: any) => opt.id === userAnswer
        );
        const selectedIndex = question.options?.findIndex(
          (opt: any) => opt.id === userAnswer
        );
        isCorrect = selectedIndex === question.correctAnswer;
      } else {
        // For ID-based, compare directly
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
            : (userOption.text || userOption.label || String(userOption));
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
            userAnswerText = typeof opt === 'string' ? opt : (opt.text || opt.label || String(opt));
          }
        }
      }

      // Get correct answer text for display
      let correctAnswerText = question.correctAnswer;
      if (correctOption) {
        correctAnswerText = typeof correctOption === 'string'
          ? correctOption
          : (correctOption.text || correctOption.label || String(correctOption));
      } else if (typeof question.correctAnswer === 'number' && question.options) {
        // Index-based answer
        const correctOpt = question.options[question.correctAnswer];
        if (correctOpt) {
          correctAnswerText = typeof correctOpt === 'string'
            ? correctOpt
            : (correctOpt.text || correctOpt.label || String(correctOpt));
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
    const passed = score >= training.quiz.passingScore;

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

    // Create quiz attempt
    const quizAttempt = await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        quizId: training.quiz.id,
        score: score,
        answers: JSON.stringify(answers),
        timeSpent: finalTimeSpent,
        startedAt: startedAtDate,
        completedAt: completedAt,
        passed: passed,
      },
    });

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
        quizCompleted: passed,
        quizScore: score,
        miniTrainingsCompleted: 0,
        totalMiniTrainings: training.miniTrainings.length,
        progress: 0,
        isCompleted: false,
      },
      update: {
        quizCompleted: passed,
        quizScore: score,
        quizPostponed: false, // Clear postponed status when quiz is submitted
      },
    });

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

    // Recalculate training progress with fresh mini-trainings data
    const overallProgress = await calculateTrainingProgress(
      {
        videoProgress: trainingProgress.videoProgress,
        quizCompleted: passed,
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

    // Update training progress with fresh mini-trainings count
    const updatedProgress = await prisma.trainingProgressNew.update({
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

    // Award XP if training is completed
    let xpEarned = 0;
    if (overallProgress.isCompleted && !trainingProgress.completedAt) {
      xpEarned = await awardTrainingXP(
        user.id,
        { totalXP: training.totalXP },
        score,
        passed
      );
    }

    // Recalculate course progress
    if (overallProgress.isCompleted) {
      await updateCourseProgress(user.id, training.course.id);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          score,
          correctAnswers,
          totalQuestions,
          passed,
          xpEarned,
          results,
          progress: overallProgress.progress,
          isCompleted: overallProgress.isCompleted,
          startedAt: quizAttempt.startedAt,
          completedAt: quizAttempt.completedAt,
          timeSpent: quizAttempt.timeSpent,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit quiz",
      },
      { status: 500 }
    );
  }
}


