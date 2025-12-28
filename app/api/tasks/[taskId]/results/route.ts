import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

// GET - Fetch quiz results (placeholder)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Await params in Next.js 14+ App Router
    const { taskId } = await params;

    // Fetch task completion to get score
    const completion = await prisma.taskCompletion.findUnique({
      where: {
        userId_taskId: {
          userId: currentUser.id,
          taskId: taskId,
        },
      },
      include: {
        task: {
          select: {
            content: true,
            xpReward: true,
          },
        },
      },
    });

    if (!completion) {
      return NextResponse.json(
        {
          success: false,
          error: "Quiz results not found. Please complete the quiz first.",
        },
        { status: 404 }
      );
    }

    // Parse quiz content to get questions
    let quizContent;
    try {
      quizContent = JSON.parse(completion.task.content || "{}");
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid quiz content format",
        },
        { status: 400 }
      );
    }

    const questions = quizContent.questions || [];
    const score = completion.score || 0;
    const baseXP = completion.task.xpReward || 10;
    const xpEarned = Math.round((baseXP * score) / 100);

    // Reconstruct results (we don't store individual answers, so we'll show question review)
    // In a full implementation, you'd store answers in TaskCompletion or a separate table
    const results = questions.map((question: any) => {
      const correctOption = question.options?.find(
        (opt: any) => opt.isCorrect === true
      ) || (typeof question.correctAnswer === "number" 
        ? question.options?.[question.correctAnswer] 
        : null);

      return {
        questionId: question.id,
        question: question.question,
        userAnswer: null, // Not stored - would need to add answers field to TaskCompletion
        correctAnswer: correctOption?.id || correctOption?.text,
        correctAnswerText: correctOption?.text,
        isCorrect: null, // Cannot determine without stored answers
        options: question.options,
        explanation: question.explanation,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          results,
          score,
          xpEarned,
          totalQuestions: questions.length,
          correctAnswers: Math.round((score / 100) * questions.length),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch quiz results",
      },
      { status: 500 }
    );
  }
}

