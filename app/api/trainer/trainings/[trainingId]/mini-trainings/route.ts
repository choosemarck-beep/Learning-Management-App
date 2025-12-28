import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { recalculateTrainingProgressForAllUsers } from "@/lib/utils/trainingProgress";
import { notifyTrainingUpdateBatch } from "@/lib/utils/notifications";
import { miniTrainingCreateSchema } from "@/lib/validation/schemas";
import { z } from "zod";

// GET - List all mini trainings for a training
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

    // Verify training ownership
    const training = await prisma.training.findFirst({
      where: {
        id: params.trainingId,
        createdBy: user.id,
      },
    });

    if (!training) {
      return NextResponse.json(
        { success: false, error: "Training not found" },
        { status: 404 }
      );
    }

    const miniTrainings = await prisma.miniTraining.findMany({
      where: {
        trainingId: params.trainingId,
      },
      include: {
        miniQuiz: {
          select: {
            id: true,
            title: true,
            passingScore: true,
          },
        },
        _count: {
          select: {
            miniTrainingProgress: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { miniTrainings },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching mini trainings:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch mini trainings",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new mini training
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

    // Verify training ownership
    const training = await prisma.training.findFirst({
      where: {
        id: params.trainingId,
        createdBy: user.id,
      },
    });

    if (!training) {
      return NextResponse.json(
        { success: false, error: "Training not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate request body
    let validatedData;
    try {
      validatedData = miniTrainingCreateSchema.parse(body);
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

    // Get the next order if not provided
    let miniTrainingOrder = validatedData.order;
    if (miniTrainingOrder === undefined) {
      const lastMiniTraining = await prisma.miniTraining.findFirst({
        where: {
          trainingId: params.trainingId,
        },
        orderBy: {
          order: "desc",
        },
      });
      miniTrainingOrder = lastMiniTraining ? lastMiniTraining.order + 1 : 0;
    }

    const miniTraining = await prisma.miniTraining.create({
      data: {
        trainingId: params.trainingId,
        title: validatedData.title,
        description: validatedData.description || null,
        videoUrl: validatedData.videoUrl || null,
        videoDuration: validatedData.videoDuration || null,
        order: miniTrainingOrder,
        isRequired: validatedData.isRequired,
      },
      include: {
        miniQuiz: true,
      },
    });

    // Recalculate progress for all users after mini-training creation
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
        "Error recalculating progress after mini-training creation:",
        error
      );
      // Don't fail the request if recalculation fails
    }

    return NextResponse.json(
      {
        success: true,
        data: { miniTraining },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating mini training:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create mini training",
      },
      { status: 500 }
    );
  }
}

