import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { courseCreateSchema } from "@/lib/validation/schemas";
import { z } from "zod";

// GET - List all courses created by the trainer
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const publishedOnly = searchParams.get("published") === "true";
    const search = searchParams.get("search") || "";

    const where: any = {
      createdBy: user.id,
    };

    if (publishedOnly) {
      where.isPublished = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        trainings: {
          select: {
            id: true,
            title: true,
            order: true,
            isPublished: true,
          },
          orderBy: {
            order: "asc",
          },
        },
        _count: {
          select: {
            trainings: true,
            courseProgresses: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { courses },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching trainer courses:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch courses",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new course
export async function POST(request: NextRequest) {
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

    // Validate request body
    let validatedData;
    try {
      validatedData = courseCreateSchema.parse(body);
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

    const course = await prisma.course.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        thumbnail: validatedData.thumbnail || null,
        totalXP: validatedData.totalXP,
        isPublished: validatedData.isPublished,
        createdBy: user.id,
      },
      include: {
        trainings: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { course },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create course",
      },
      { status: 500 }
    );
  }
}

