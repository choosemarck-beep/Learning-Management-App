import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import bcrypt from "bcryptjs";
import { recalculateTrainingProgressForAllUsers } from "@/lib/utils/trainingProgress";
import { notifyTrainingUpdateBatch } from "@/lib/utils/notifications";

// GET - Get quiz for a training
export async function GET(
  request: NextRequest,
  { params }: { params: { trainingId: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "TRAINER") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Trainer access only" },
        { status: 403 }
      );
    }

    // Verify training exists
    const training = await prisma.training.findUnique({
      where: {
        id: params.trainingId,
      },
    });

    if (!training) {
      return NextResponse.json(
        { success: false, error: "Training not found" },
        { status: 404 }
      );
    }

    const quiz = await prisma.quiz.findUnique({
      where: {
        trainingId: params.trainingId,
      },
      include: {
        _count: {
          select: {
            quizAttempts: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { quiz: quiz || null },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch quiz",
      },
      { status: 500 }
    );
  }
}

// POST - Create or update quiz for a training
export async function POST(
  request: NextRequest,
  { params }: { params: { trainingId: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "TRAINER") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Trainer access only" },
        { status: 403 }
      );
    }

    // Verify training exists
    const training = await prisma.training.findUnique({
      where: {
        id: params.trainingId,
      },
    });

    if (!training) {
      return NextResponse.json(
        { success: false, error: "Training not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      password,
      title,
      passingScore,
      timeLimit,
      allowRetake,
      maxAttempts,
      questionsToShow,
      questions,
    } = body;

    // Verify password for updates (if quiz exists)
    const existingQuiz = await prisma.quiz.findUnique({
      where: {
        trainingId: params.trainingId,
      },
    });

    if (existingQuiz && !password) {
      return NextResponse.json(
        { success: false, error: "Password is required to update quiz" },
        { status: 400 }
      );
    }

    if (existingQuiz && password) {
      // Get user with password to verify
      const userWithPassword = await prisma.user.findUnique({
        where: { id: user.id },
        select: { password: true },
      });

      if (!userWithPassword || !userWithPassword.password) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: "Invalid password" },
          { status: 401 }
        );
      }
    }

    // Validation
    if (!title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { success: false, error: "Questions must be an array" },
        { status: 400 }
      );
    }

    // existingQuiz already fetched above for password check

    const wasQuizCreated = !existingQuiz; // Track if this is a new quiz creation

    let quiz;
    if (existingQuiz) {
      // Update existing quiz
      quiz = await prisma.quiz.update({
        where: {
          id: existingQuiz.id,
        },
        data: {
          title,
          passingScore: passingScore || 70,
          timeLimit: timeLimit || null,
          allowRetake: allowRetake !== undefined ? allowRetake : true,
          maxAttempts: maxAttempts || null,
          questionsToShow: questionsToShow || null,
          questions: JSON.stringify(questions),
        },
      });
    } else {
      // Create new quiz
      quiz = await prisma.quiz.create({
        data: {
          trainingId: params.trainingId,
          title,
          passingScore: passingScore || 70,
          timeLimit: timeLimit || null,
          allowRetake: allowRetake !== undefined ? allowRetake : true,
          maxAttempts: maxAttempts || null,
          questionsToShow: questionsToShow || null,
          questions: JSON.stringify(questions),
        },
      });
    }

    // If quiz was just created, recalculate progress for all users and notify affected ones
    if (wasQuizCreated) {
      try {
        const affectedUserIds = await recalculateTrainingProgressForAllUsers(
          params.trainingId
        );

        // Notify users whose completion status was affected
        if (affectedUserIds.length > 0) {
          await notifyTrainingUpdateBatch(
            affectedUserIds,
            params.trainingId,
            training.title
          );
        }
      } catch (error) {
        console.error(
          "Error recalculating progress after quiz creation:",
          error
        );
        // Don't fail the request if recalculation fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: { quiz },
      },
      { status: existingQuiz ? 200 : 201 }
    );
  } catch (error) {
    console.error("Error creating/updating quiz:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create/update quiz",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: { trainingId: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "TRAINER") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Trainer access only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { password } = body;

    // Verify password
    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    // Get user with password to verify
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    if (!userWithPassword || !userWithPassword.password) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid password" },
        { status: 401 }
      );
    }

    // Verify training exists
    const training = await prisma.training.findUnique({
      where: {
        id: params.trainingId,
      },
    });

    if (!training) {
      return NextResponse.json(
        { success: false, error: "Training not found" },
        { status: 404 }
      );
    }

    const quiz = await prisma.quiz.findUnique({
      where: {
        trainingId: params.trainingId,
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: "Quiz not found" },
        { status: 404 }
      );
    }

    await prisma.quiz.delete({
      where: {
        id: quiz.id,
      },
    });

    // Recalculate progress for all users after quiz deletion
    try {
      const affectedUserIds = await recalculateTrainingProgressForAllUsers(
        params.trainingId
      );

      // Notify users whose completion status was affected
      if (affectedUserIds.length > 0) {
        await notifyTrainingUpdateBatch(
          affectedUserIds,
          params.trainingId,
          training.title
        );
      }
    } catch (error) {
      console.error(
        "Error recalculating progress after quiz deletion:",
        error
      );
      // Don't fail the request if recalculation fails
    }

    return NextResponse.json(
      {
        success: true,
        message: "Quiz deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete quiz",
      },
      { status: 500 }
    );
  }
}

