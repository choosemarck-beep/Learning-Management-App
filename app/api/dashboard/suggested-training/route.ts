import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const suggestedCourses: any[] = [];

    // 1. NEW COURSES - Recently published courses (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newCourses = await prisma.course.findMany({
      where: {
        isPublished: true,
        createdAt: {
          gte: thirtyDaysAgo,
        },
        // Exclude courses user has already completed
        courseProgresses: {
          none: {
            userId: currentUser.id,
            isCompleted: true,
          },
        },
      },
      include: {
        courseProgresses: {
          where: {
            userId: currentUser.id,
          },
          select: {
            progress: true,
            isCompleted: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    newCourses.forEach((course) => {
      const progress = course.courseProgresses[0];
      suggestedCourses.push({
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        totalXP: course.totalXP,
        progress: progress?.progress || 0,
        isCompleted: progress?.isCompleted || false,
        category: "NEW" as const,
      });
    });

    // 2. RECOMMENDED COURSES - Based on user's position, department, and progress
    // Get user's position and department
    const userData = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        positionId: true,
        department: true,
        courseProgresses: {
          select: {
            courseId: true,
            isCompleted: true,
          },
        },
      },
    });

    const completedCourseIds = new Set(
      userData?.courseProgresses
        .filter((cp) => cp.isCompleted)
        .map((cp) => cp.courseId) || []
    );

    // Find courses not yet completed
    const recommendedCourses = await prisma.course.findMany({
      where: {
        isPublished: true,
        id: {
          notIn: Array.from(completedCourseIds),
        },
        // Could add more sophisticated recommendation logic here
        // For now, just get popular courses
      },
      include: {
        courseProgresses: {
          where: {
            userId: currentUser.id,
          },
          select: {
            progress: true,
            isCompleted: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    recommendedCourses.forEach((course) => {
      const progress = course.courseProgresses[0];
      // Skip if already in new courses
      if (!suggestedCourses.find((c) => c.id === course.id && c.category === "NEW")) {
        suggestedCourses.push({
          id: course.id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          totalXP: course.totalXP,
          progress: progress?.progress || 0,
          isCompleted: progress?.isCompleted || false,
          category: "RECOMMENDED" as const,
        });
      }
    });

    // 3. ASSIGNED COURSES - Courses assigned by manager (in progress or not started)
    const assignedProgresses = await prisma.courseProgress.findMany({
      where: {
        userId: currentUser.id,
        isCompleted: false,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            totalXP: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    assignedProgresses.forEach((cp) => {
      // Skip if already in other categories
      if (!suggestedCourses.find((c) => c.id === cp.course.id)) {
        suggestedCourses.push({
          id: cp.course.id,
          title: cp.course.title,
          description: cp.course.description,
          thumbnail: cp.course.thumbnail,
          totalXP: cp.course.totalXP,
          progress: cp.progress,
          isCompleted: cp.isCompleted,
          category: "ASSIGNED" as const,
        });
      }
    });

    return NextResponse.json(
      { success: true, data: suggestedCourses },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching suggested training:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

