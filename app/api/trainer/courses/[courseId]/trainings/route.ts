import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

// GET - List all trainings in a course
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
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

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: {
        id: params.courseId,
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    const trainings = await prisma.training.findMany({
      where: {
        courseId: params.courseId,
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            passingScore: true,
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
      orderBy: {
        order: "asc",
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

// POST - Create a new training in a course
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
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

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: {
        id: params.courseId,
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      title,
      shortDescription,
      videoUrl,
      videoDuration,
      videoThumbnail,
      minimumWatchTime,
      order,
      totalXP,
      isPublished,
    } = body;

    // Validation
    if (!title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    // Get the next order if not provided
    let trainingOrder = order;
    if (trainingOrder === undefined) {
      const lastTraining = await prisma.training.findFirst({
        where: {
          courseId: params.courseId,
        },
        orderBy: {
          order: "desc",
        },
      });
      trainingOrder = lastTraining ? lastTraining.order + 1 : 0;
    }

    const training = await prisma.training.create({
      data: {
        courseId: params.courseId,
        title,
        shortDescription: shortDescription || null,
        videoUrl: videoUrl || null,
        videoDuration: videoDuration || null,
        videoThumbnail: videoThumbnail || null,
        minimumWatchTime: minimumWatchTime || null,
        order: trainingOrder,
        totalXP: totalXP || 0,
        isPublished: isPublished || false,
        createdBy: user.id,
      },
      include: {
        quiz: true,
        miniTrainings: true,
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

