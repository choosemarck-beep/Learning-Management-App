import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { recalculateTrainingProgressForAllUsers } from "@/lib/utils/trainingProgress";
import { notifyTrainingUpdateBatch } from "@/lib/utils/notifications";

// GET - Get mini quiz for a mini training
export async function GET(
  request: NextRequest,
  { params }: { params: { miniTrainingId: string } }
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

    // Verify mini training exists
    const miniTraining = await prisma.miniTraining.findUnique({
      where: {
        id: params.miniTrainingId,
      },
    });

    if (!miniTraining) {
      return NextResponse.json(
        { success: false, error: "Mini training not found" },
        { status: 404 }
      );
    }

    const miniQuiz = await prisma.miniQuiz.findUnique({
      where: {
        miniTrainingId: params.miniTrainingId,
      },
      include: {
        _count: {
          select: {
            miniQuizAttempts: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { miniQuiz: miniQuiz || null },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching mini quiz:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch mini quiz",
      },
      { status: 500 }
    );
  }
}

// POST - Create or update mini quiz
export async function POST(
  request: NextRequest,
  { params }: { params: { miniTrainingId: string } }
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

    // Verify mini training ownership
    const miniTraining = await prisma.miniTraining.findUnique({
      where: {
        id: params.miniTrainingId,
      },
      include: {
        training: {
          select: {
            createdBy: true,
          },
        },
      },
    });

    if (!miniTraining) {
      return NextResponse.json(
        { success: false, error: "Mini training not found" },
        { status: 404 }
      );
    }

    if (miniTraining.training.createdBy !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden - You don't own this mini training" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, passingScore, questionsToShow, questions } = body;

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

    // Check if mini quiz already exists
    const existingMiniQuiz = await prisma.miniQuiz.findUnique({
      where: {
        miniTrainingId: params.miniTrainingId,
      },
    });

    const wasMiniQuizCreated = !existingMiniQuiz; // Track if this is a new mini-quiz creation
    const trainingId = miniTraining.trainingId;

    let miniQuiz;
    if (existingMiniQuiz) {
      // Update existing mini quiz
      miniQuiz = await prisma.miniQuiz.update({
        where: {
          id: existingMiniQuiz.id,
        },
        data: {
          title,
          passingScore: passingScore || 70,
          questionsToShow: questionsToShow || null,
          questions: JSON.stringify(questions),
        },
      });
    } else {
      // Create new mini quiz
      miniQuiz = await prisma.miniQuiz.create({
        data: {
          miniTrainingId: params.miniTrainingId,
          title,
          passingScore: passingScore || 70,
          questionsToShow: questionsToShow || null,
          questions: JSON.stringify(questions),
        },
      });
    }

    // If mini-quiz was just created, recalculate progress for all users
    // This affects mini-training internal weights (70/30 split)
    if (wasMiniQuizCreated) {
      try {
        // Fetch parent training title for notification
        const parentTraining = await prisma.training.findUnique({
          where: { id: trainingId },
          select: { title: true },
        });

        if (parentTraining) {
          const affectedUserIds = await recalculateTrainingProgressForAllUsers(
            trainingId
          );

          // Notify users whose completion status was affected
          if (affectedUserIds.length > 0) {
            await notifyTrainingUpdateBatch(
              affectedUserIds,
              trainingId,
              parentTraining.title
            );
          }
        }
      } catch (error) {
        console.error(
          "Error recalculating progress after mini-quiz creation:",
          error
        );
        // Don't fail the request if recalculation fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: { miniQuiz },
      },
      { status: existingMiniQuiz ? 200 : 201 }
    );
  } catch (error) {
    console.error("Error creating/updating mini quiz:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create/update mini quiz",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete mini quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: { miniTrainingId: string } }
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

    // Verify mini training ownership
    const miniTraining = await prisma.miniTraining.findUnique({
      where: {
        id: params.miniTrainingId,
      },
      include: {
        training: {
          select: {
            createdBy: true,
          },
        },
      },
    });

    if (!miniTraining) {
      return NextResponse.json(
        { success: false, error: "Mini training not found" },
        { status: 404 }
      );
    }

    if (miniTraining.training.createdBy !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden - You don't own this mini training" },
        { status: 403 }
      );
    }

    const miniQuiz = await prisma.miniQuiz.findUnique({
      where: {
        miniTrainingId: params.miniTrainingId,
      },
    });

    if (!miniQuiz) {
      return NextResponse.json(
        { success: false, error: "Mini quiz not found" },
        { status: 404 }
      );
    }

    const trainingId = miniTraining.trainingId;

    await prisma.miniQuiz.delete({
      where: {
        id: miniQuiz.id,
      },
    });

    // Recalculate progress for all users after mini-quiz deletion
    // This affects mini-training internal weights (70/30 split)
    try {
      // Fetch parent training title for notification
      const parentTraining = await prisma.training.findUnique({
        where: { id: trainingId },
        select: { title: true },
      });

      if (parentTraining) {
        const affectedUserIds = await recalculateTrainingProgressForAllUsers(
          trainingId
        );

        // Notify users whose completion status was affected
        if (affectedUserIds.length > 0) {
          await notifyTrainingUpdateBatch(
            affectedUserIds,
            trainingId,
            parentTraining.title
          );
        }
      }
    } catch (error) {
      console.error(
        "Error recalculating progress after mini-quiz deletion:",
        error
      );
      // Don't fail the request if recalculation fails
    }

    return NextResponse.json(
      {
        success: true,
        message: "Mini quiz deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting mini quiz:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete mini quiz",
      },
      { status: 500 }
    );
  }
}

