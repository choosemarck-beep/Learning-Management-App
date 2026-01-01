import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { recalculateTrainingProgressForAllUsers } from "@/lib/utils/trainingProgress";
import { notifyTrainingUpdateBatch } from "@/lib/utils/notifications";

// GET - Get mini training details
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

    const miniTraining = await prisma.miniTraining.findUnique({
      where: {
        id: params.miniTrainingId,
      },
      include: {
        training: {
          select: {
            id: true,
            title: true,
            createdBy: true,
          },
        },
        miniQuiz: true,
        _count: {
          select: {
            miniTrainingProgress: true,
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


    return NextResponse.json(
      {
        success: true,
        data: { miniTraining },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching mini training:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch mini training",
      },
      { status: 500 }
    );
  }
}

// PUT - Update mini training
export async function PUT(
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

    // Verify ownership
    const existingMiniTraining = await prisma.miniTraining.findUnique({
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

    if (!existingMiniTraining) {
      return NextResponse.json(
        { success: false, error: "Mini training not found" },
        { status: 404 }
      );
    }

    if (existingMiniTraining.training.createdBy !== user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden - You don't own this mini training" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      videoUrl,
      videoDuration,
      order,
      isRequired,
    } = body;

    const miniTraining = await prisma.miniTraining.update({
      where: {
        id: params.miniTrainingId,
      },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(videoUrl !== undefined && { videoUrl: videoUrl || null }),
        ...(videoDuration !== undefined && { videoDuration: videoDuration || null }),
        ...(order !== undefined && { order }),
        ...(isRequired !== undefined && { isRequired }),
      },
      include: {
        miniQuiz: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { miniTraining },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating mini training:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update mini training",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete mini training
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

    // Verify mini training exists
    const existingMiniTraining = await prisma.miniTraining.findUnique({
      where: {
        id: params.miniTrainingId,
      },
    });

    if (!existingMiniTraining) {
      return NextResponse.json(
        { success: false, error: "Mini training not found" },
        { status: 404 }
      );
    }

    const trainingId = existingMiniTraining.trainingId;

    await prisma.miniTraining.delete({
      where: {
        id: params.miniTrainingId,
      },
    });

    // Recalculate progress for all users after mini-training deletion
    try {
      // Fetch training title for notification
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
        "Error recalculating progress after mini-training deletion:",
        error
      );
      // Don't fail the request if recalculation fails
    }

    return NextResponse.json(
      {
        success: true,
        message: "Mini training deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting mini training:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete mini training",
      },
      { status: 500 }
    );
  }
}

