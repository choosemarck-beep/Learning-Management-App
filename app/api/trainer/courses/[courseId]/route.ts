import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import bcrypt from "bcryptjs";
import { courseUpdateSchema } from "@/lib/validation/schemas";
import { z } from "zod";

// GET - Get course details with trainings
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

    const course = await prisma.course.findFirst({
      where: {
        id: params.courseId,
        createdBy: user.id, // Ensure trainer owns this course
      },
      include: {
        trainings: {
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
        },
        _count: {
          select: {
            courseProgresses: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { course },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch course",
      },
      { status: 500 }
    );
  }
}

// PUT - Update course
export async function PUT(
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

    // Verify course ownership
    const existingCourse = await prisma.course.findFirst({
      where: {
        id: params.courseId,
        createdBy: user.id,
      },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate request body
    let validatedData;
    try {
      validatedData = courseUpdateSchema.parse(body);
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
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.thumbnail !== undefined) updateData.thumbnail = validatedData.thumbnail;
    if (validatedData.totalXP !== undefined) updateData.totalXP = validatedData.totalXP;
    if (validatedData.isPublished !== undefined) updateData.isPublished = validatedData.isPublished;

    const course = await prisma.course.update({
      where: {
        id: params.courseId,
      },
      data: updateData,
      include: {
        trainings: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { course },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update course",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete course (cascades to trainings, quizzes, etc.)
export async function DELETE(
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

    // Verify course ownership
    const existingCourse = await prisma.course.findFirst({
      where: {
        id: params.courseId,
        createdBy: user.id,
      },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    await prisma.course.delete({
      where: {
        id: params.courseId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Course deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete course",
      },
      { status: 500 }
    );
  }
}

