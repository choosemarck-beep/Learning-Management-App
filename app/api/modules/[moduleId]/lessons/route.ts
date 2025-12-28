import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Await params in Next.js 14+ App Router
    const { moduleId } = await params;

    // Fetch module with course to check if published
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        course: {
          select: {
            id: true,
            isPublished: true,
          },
        },
      },
    });

    if (!module) {
      return NextResponse.json(
        { success: false, error: "Module not found" },
        { status: 404 }
      );
    }

    // Check if course is published
    if (!module.course.isPublished) {
      return NextResponse.json(
        { success: false, error: "Course is not published" },
        { status: 403 }
      );
    }

    // Fetch lessons ordered by order field
    const lessons = await prisma.lesson.findMany({
      where: {
        moduleId: moduleId,
      },
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        order: true,
        videoUrl: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          lessons,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch lessons",
      },
      { status: 500 }
    );
  }
}

