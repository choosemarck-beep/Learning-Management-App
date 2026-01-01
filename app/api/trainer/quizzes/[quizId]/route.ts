import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { quizUpdateSchema } from "@/lib/validation/schemas";
import { z } from "zod";

// PUT - Update quiz
export async function PUT(
  request: NextRequest,
  { params }: { params: { quizId: string } }
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

    // Verify quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: params.quizId,
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: "Quiz not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate request body
    let validatedData;
    try {
      validatedData = quizUpdateSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation error",
            details: error.errors,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Additional validation for questions array
    if (validatedData.questions !== undefined && !Array.isArray(validatedData.questions)) {
      return NextResponse.json(
        { success: false, error: "Questions must be an array" },
        { status: 400 }
      );
    }

    // Build update data from validated fields
    const updateData: any = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.passingScore !== undefined) updateData.passingScore = validatedData.passingScore;
    if (validatedData.timeLimit !== undefined) updateData.timeLimit = validatedData.timeLimit;
    if (validatedData.allowRetake !== undefined) updateData.allowRetake = validatedData.allowRetake;
    if (validatedData.maxAttempts !== undefined) updateData.maxAttempts = validatedData.maxAttempts;
    if (validatedData.questions !== undefined) updateData.questions = JSON.stringify(validatedData.questions);

    const updatedQuiz = await prisma.quiz.update({
      where: {
        id: params.quizId,
      },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        data: { quiz: updatedQuiz },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating quiz:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update quiz",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: { quizId: string } }
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

    // Verify quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: params.quizId,
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
        id: params.quizId,
      },
    });

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

