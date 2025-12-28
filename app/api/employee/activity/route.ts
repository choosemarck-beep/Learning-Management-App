import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only BRANCH_MANAGER and EMPLOYEE can access
    if (user.role !== "BRANCH_MANAGER" && user.role !== "EMPLOYEE") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Fetch task completions
    const taskCompletions = await prisma.taskCompletion.findMany({
      where: { userId: user.id },
      include: {
        task: {
          include: {
            lesson: {
              include: {
                module: {
                  include: {
                    course: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
      take: 50, // Limit to 50 most recent
    });

    // Fetch badges
    const badges = await prisma.badge.findMany({
      where: { userId: user.id },
      orderBy: {
        earnedAt: "desc",
      },
      take: 20,
    });

    // Transform data into activity feed format
    const activities: any[] = [];

    // Add task completions
    taskCompletions.forEach((tc) => {
      activities.push({
        id: `task-${tc.id}`,
        type: "TASK_COMPLETED",
        description: `Completed "${tc.task.title}" in ${tc.task.lesson.module.course.title}`,
        timestamp: tc.completedAt,
        courseName: tc.task.lesson.module.course.title,
        lessonName: tc.task.lesson.title,
        taskName: tc.task.title,
      });
    });

    // Add badges
    badges.forEach((badge) => {
      activities.push({
        id: `badge-${badge.id}`,
        type: "ACHIEVEMENT_EARNED",
        description: `Earned badge: ${badge.name}`,
        timestamp: badge.earnedAt,
        badgeName: badge.name,
      });
    });

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Limit to 30 most recent
    const recentActivities = activities.slice(0, 30);

    return NextResponse.json(
      {
        success: true,
        data: recentActivities,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Activity feed error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

