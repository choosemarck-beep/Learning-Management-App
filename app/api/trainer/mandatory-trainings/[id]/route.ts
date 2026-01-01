import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

// PATCH - Update a mandatory training
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (currentUser.role !== "TRAINER") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Trainer access only" },
        { status: 403 }
      );
    }

    // Await params in Next.js 14+ App Router
    const { id } = await params;
    const body = await request.json();
    const { title, description, badgeIcon, badgeColor, isActive } = body;

    // Verify training exists
    const existingTraining = await prisma.mandatoryTraining.findUnique({
      where: { id },
    });

    if (!existingTraining) {
      return NextResponse.json(
        { success: false, error: "Training not found" },
        { status: 404 }
      );
    }

    // Update training
    const updatedTraining = await prisma.mandatoryTraining.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(badgeIcon !== undefined && { badgeIcon: badgeIcon?.trim() || null }),
        ...(badgeColor !== undefined && { badgeColor: badgeColor?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        type: "TRAINING_UPDATED",
        userId: currentUser.id,
        targetId: updatedTraining.id,
        targetType: "MandatoryTraining",
        description: `Updated mandatory training: ${updatedTraining.title}`,
        metadata: JSON.stringify({
          trainingId: updatedTraining.id,
          trainingTitle: updatedTraining.title,
          changes: Object.keys(body),
        }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { training: updatedTraining },
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

// DELETE - Delete a mandatory training
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (currentUser.role !== "TRAINER") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Trainer access only" },
        { status: 403 }
      );
    }

    // Await params in Next.js 14+ App Router
    const { id } = await params;

    // Verify training exists
    const existingTraining = await prisma.mandatoryTraining.findUnique({
      where: { id },
    });

    if (!existingTraining) {
      return NextResponse.json(
        { success: false, error: "Training not found" },
        { status: 404 }
      );
    }

    // Store training info for activity log before deletion
    const trainingTitle = existingTraining.title;

    // Delete training (cascade will delete related progress records)
    await prisma.mandatoryTraining.delete({
      where: { id },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        type: "TRAINING_DELETED",
        userId: currentUser.id,
        targetId: id,
        targetType: "MandatoryTraining",
        description: `Deleted mandatory training: ${trainingTitle}`,
        metadata: JSON.stringify({
          trainingId: id,
          trainingTitle,
        }),
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

