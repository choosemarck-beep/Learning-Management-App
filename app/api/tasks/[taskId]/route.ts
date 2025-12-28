import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

// Simple seeded random number generator for consistent randomization
function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

// Shuffle array using seeded random
function shuffleArray<T>(array: T[], seed: number): T[] {
  const random = seededRandom(seed);
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function GET(
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

    // Get attempt count (check existing completions)
    const attemptCount = await prisma.taskCompletion.count({
      where: {
        userId: user.id,
        taskId: taskId,
      },
    });

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

    let questions = quizContent.questions || [];
    if (questions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Quiz has no questions" },
        { status: 400 }
      );
    }

    // Create seed based on user ID, task ID, and attempt count for consistent randomization
    const seedString = `${user.id}-${taskId}-${attemptCount}`;
    let seed = 0;
    for (let i = 0; i < seedString.length; i++) {
      seed = ((seed << 5) - seed + seedString.charCodeAt(i)) & 0xffffffff;
    }
    seed = Math.abs(seed);

    // Randomize questions based on attempt count
    questions = shuffleArray(questions, seed);

    // Randomize options for each question based on attempt count
    questions = questions.map((question: any) => {
      if (question.options && Array.isArray(question.options)) {
        // Create seed for this specific question
        const questionSeed = seed + question.id.charCodeAt(0);
        const randomizedOptions = shuffleArray(question.options, questionSeed);
        
        // Update correctAnswer index if it's a number (for multiple choice)
        if (typeof question.correctAnswer === "number") {
          const originalCorrectOption = question.options[question.correctAnswer];
          const newIndex = randomizedOptions.findIndex(
            (opt: any) => opt.id === originalCorrectOption.id
          );
          return {
            ...question,
            options: randomizedOptions,
            correctAnswer: newIndex >= 0 ? newIndex : question.correctAnswer,
          };
        }
      }
      return question;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          task: {
            id: task.id,
            title: task.title,
            content: JSON.stringify({ questions }), // Return randomized questions
            xpReward: task.xpReward,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch task",
      },
      { status: 500 }
    );
  }
}

