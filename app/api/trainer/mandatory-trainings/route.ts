import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

// GET - Fetch all mandatory trainings (trainer view)
export async function GET(request: NextRequest) {
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

    const trainings = await prisma.mandatoryTraining.findMany({
      where: {
        createdBy: currentUser.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { trainings },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching trainings:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch trainings",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new mandatory training
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { title, description, badgeIcon, badgeColor } = body;

    if (!title || title.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    // Create training
    const training = await prisma.mandatoryTraining.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        badgeIcon: badgeIcon?.trim() || null,
        badgeColor: badgeColor?.trim() || null,
        createdBy: currentUser.id,
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        type: "TRAINING_CREATED",
        userId: currentUser.id,
        targetId: training.id,
        targetType: "MandatoryTraining",
        description: `Created mandatory training: ${training.title}`,
        metadata: JSON.stringify({
          trainingId: training.id,
          trainingTitle: training.title,
        }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { training },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating training:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create training",
      },
      { status: 500 }
    );
  }
}

