import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

interface QuizAnswer {
  questionId: string;
  answerId: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Await params in Next.js 14+ App Router
    const { taskId } = await params;
    const body = await request.json();
    const { answers } = body as { answers: Record<string, string> };

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid answers format" },
        { status: 400 }
      );
    }

    // Fetch task with quiz content
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: {
                  select: {
                    isPublished: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    if (task.type !== "quiz") {
      return NextResponse.json(
        { success: false, error: "Task is not a quiz" },
        { status: 400 }
      );
    }

    // Check if course is published
    if (!task.lesson.module.course.isPublished) {
      return NextResponse.json(
        { success: false, error: "Course is not published" },
        { status: 403 }
      );
    }

    // Check if already completed
    const existingCompletion = await prisma.taskCompletion.findUnique({
      where: {
        userId_taskId: {
          userId: user.id,
          taskId: taskId,
        },
      },
    });

    if (existingCompletion) {
      return NextResponse.json(
        { success: false, error: "Quiz already completed" },
        { status: 400 }
      );
    }

    // Parse quiz content
    let quizContent;
    try {
      quizContent = JSON.parse(task.content);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid quiz content format" },
        { status: 400 }
      );
    }

    const questions = quizContent.questions || [];
    if (questions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Quiz has no questions" },
        { status: 400 }
      );
    }

    // Calculate score
    let correctAnswers = 0;
    const results = questions.map((question: any) => {
      const userAnswer = answers[question.id];
      
      // Handle both index-based (for randomized multiple choice) and ID-based answers
      let correctOption;
      if (typeof question.correctAnswer === "number") {
        // Index-based (randomized multiple choice)
        correctOption = question.options?.[question.correctAnswer];
      } else {
        // ID-based (true/false, short answer, or non-randomized)
        correctOption = question.options?.find(
          (opt: any) => opt.isCorrect === true
        );
      }
      
      // Check if answer is correct
      let isCorrect = false;
      if (typeof question.correctAnswer === "number") {
        // For index-based, compare by option ID
        const selectedOption = question.options?.find(
          (opt: any) => opt.id === userAnswer
        );
        const selectedIndex = question.options?.findIndex(
          (opt: any) => opt.id === userAnswer
        );
        isCorrect = selectedIndex === question.correctAnswer;
      } else {
        // For ID-based, compare directly
        isCorrect = userAnswer === correctOption?.id;
      }

      if (isCorrect) {
        correctAnswers++;
      }

      return {
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: correctOption?.id || correctOption?.text,
        correctAnswerText: correctOption?.text || correctOption?.id,
        isCorrect,
        options: question.options,
        explanation: question.explanation,
      };
    });

    const totalQuestions = questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    // Calculate XP (base reward * score percentage)
    const baseXP = task.xpReward || 10;
    const xpEarned = Math.round((baseXP * score) / 100);

    // Store results in task completion (we'll store in a JSON field if available, or use metadata)
    // For now, we'll store the score and the results will be recalculated on fetch
    // In a full implementation, you might want to add a results JSON field to TaskCompletion
    await prisma.taskCompletion.create({
      data: {
        userId: user.id,
        taskId: taskId,
        score: score,
      },
    });

    // Update user XP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: {
          increment: xpEarned,
        },
      },
    });

    // Recalculate level and rank (simplified - you may want to use your gamification constants)
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { xp: true },
    });

    if (updatedUser) {
      const newLevel = Math.floor(updatedUser.xp / 1000) + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          level: newLevel,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          score,
          correctAnswers,
          totalQuestions,
          xpEarned,
          results,
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

