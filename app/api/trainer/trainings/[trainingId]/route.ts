import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { trainingUpdateSchema } from "@/lib/validation/schemas";

// GET - Get training details
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

    const training = await prisma.training.findUnique({
      where: {
        id: params.trainingId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        quiz: {
          include: {
            _count: {
              select: {
                quizAttempts: true,
              },
            },
          },
        },
        miniTrainings: {
          include: {
            miniQuiz: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
        _count: {
          select: {
            trainingProgress: true,
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

    return NextResponse.json(
      {
        success: true,
        data: { training },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching training:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch training",
      },
      { status: 500 }
    );
  }
}

// PUT - Update training
export async function PUT(
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
    const existingTraining = await prisma.training.findFirst({
      where: {
        id: params.trainingId,
        createdBy: user.id,
      },
    });

    if (!existingTraining) {
      return NextResponse.json(
        { success: false, error: "Training not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate request body
    let validatedData;
    try {
      validatedData = trainingUpdateSchema.parse(body);
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

    // Verify password
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

    const isPasswordValid = await bcrypt.compare(validatedData.password, userWithPassword.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid password" },
        { status: 401 }
      );
    }

    // Build update data from validated fields
    const updateData: any = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.shortDescription !== undefined) updateData.shortDescription = validatedData.shortDescription;
    if (validatedData.videoUrl !== undefined) updateData.videoUrl = validatedData.videoUrl;
    if (validatedData.videoDuration !== undefined) updateData.videoDuration = validatedData.videoDuration;
    if (validatedData.videoThumbnail !== undefined) updateData.videoThumbnail = validatedData.videoThumbnail;
    if (validatedData.minimumWatchTime !== undefined) updateData.minimumWatchTime = validatedData.minimumWatchTime;
    if (validatedData.order !== undefined) updateData.order = validatedData.order;
    if (validatedData.totalXP !== undefined) updateData.totalXP = validatedData.totalXP;
    if (validatedData.isPublished !== undefined) updateData.isPublished = validatedData.isPublished;

    const training = await prisma.training.update({
      where: {
        id: params.trainingId,
      },
      data: updateData,
      include: {
        quiz: true,
        miniTrainings: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { training },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating training:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update training",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete training (cascades to quiz, mini trainings, etc.)
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
    const existingTraining = await prisma.training.findUnique({
      where: {
        id: params.trainingId,
      },
    });

    if (!existingTraining) {
      return NextResponse.json(
        { success: false, error: "Training not found" },
        { status: 404 }
      );
    }

    await prisma.training.delete({
      where: {
        id: params.trainingId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Training deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting training:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete training",
      },
      { status: 500 }
    );
  }
}

