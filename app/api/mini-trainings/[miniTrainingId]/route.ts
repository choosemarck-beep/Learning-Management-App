import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { randomizeQuizQuestions } from "@/lib/utils/quizRandomization";

// GET - Get mini training details for employees
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ miniTrainingId: string }> }
) {
  try {
    const { miniTrainingId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch mini-training with related data
    const miniTraining = await prisma.miniTraining.findUnique({
      where: { id: miniTrainingId },
      include: {
        training: {
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
        },
        miniQuiz: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            questions: true,
            questionsToShow: true,
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

    // Get user's progress for this mini-training
    const progress = await prisma.miniTrainingProgress.findUnique({
      where: {
        userId_miniTrainingId: {
          userId: user.id,
          miniTrainingId: miniTrainingId,
        },
      },
    });

    // Get attempt number for randomization
    const existingAttempts = await prisma.miniQuizAttempt.findMany({
      where: {
        userId: user.id,
        miniQuizId: miniTraining.miniQuiz?.id || "",
      },
      orderBy: {
        completedAt: "desc",
      },
    });
    const attemptNumber = existingAttempts.length + 1;

    // Parse and randomize questions if miniQuiz exists
    let miniQuizData = miniTraining.miniQuiz;
    if (miniQuizData && miniQuizData.questions) {
      try {
        let parsedQuestions = JSON.parse(miniQuizData.questions || "[]");
        
        // Normalize question options format
        parsedQuestions = parsedQuestions.map((question: any) => {
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

        // Apply randomization if questionsToShow is set
        // ALWAYS apply randomization to prevent cheating and memorization
        if (parsedQuestions.length > 0) {
          const questionsToShow = miniTraining.miniQuiz?.questionsToShow;
          const randomized = randomizeQuizQuestions(
            parsedQuestions,
            questionsToShow, // Can be null (show all) - still randomizes order
            user.id,
            attemptNumber
          );
          // Convert randomized questions to expected format
          parsedQuestions = randomized.map((q: { id: string; type: string; question: string; options: Array<{ id: string; text: string }>; correctAnswer?: number | string; points?: number; explanation?: string }) => ({
            id: q.id,
            type: q.type,
            question: q.question,
            options: q.options.map((opt: { id: string; text: string }) => ({
              id: opt.id,
              text: opt.text,
            })),
            correctAnswer: q.correctAnswer,
            points: q.points,
            explanation: q.explanation,
          }));
        }

        miniQuizData = {
          ...miniQuizData,
          questions: JSON.stringify(parsedQuestions),
        };
      } catch (error) {
        console.error("Error parsing/randomizing mini-quiz questions:", error);
        miniQuizData = {
          ...miniQuizData,
          questions: "[]",
        };
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          miniTraining: {
            id: miniTraining.id,
            title: miniTraining.title,
            description: miniTraining.description,
            videoUrl: miniTraining.videoUrl,
            videoDuration: miniTraining.videoDuration,
            order: miniTraining.order,
            isRequired: miniTraining.isRequired,
            miniQuiz: miniQuizData,
          },
          training: miniTraining.training,
          progress: progress
            ? {
                videoProgress: progress.videoProgress,
                quizCompleted: progress.quizCompleted,
                isCompleted: progress.isCompleted,
              }
            : {
                videoProgress: 0,
                quizCompleted: false,
                isCompleted: false,
              },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching mini-training:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch mini-training",
      },
      { status: 500 }
    );
  }
}

