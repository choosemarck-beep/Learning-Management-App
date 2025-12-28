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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || currentUser.id;

    // Verify user can access this data (own data or admin)
    if (userId !== currentUser.id && currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Fetch user data with related information
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        courseProgresses: {
          select: {
            isCompleted: true,
            progress: true,
            createdAt: true,
          },
        },
        badges: {
          orderBy: {
            earnedAt: "desc",
          },
          take: 5,
          select: {
            id: true,
            name: true,
            type: true,
            earnedAt: true,
          },
        },
        createdAt: true,
      },
    });

    if (!userData) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Calculate metrics
    const coursesCompleted = userData.courseProgresses.filter(
      (cp) => cp.isCompleted
    ).length;
    const totalCoursesStarted = userData.courseProgresses.length;
    const completionRate =
      totalCoursesStarted > 0
        ? (coursesCompleted / totalCoursesStarted) * 100
        : 0;

    // Calculate progress to next level
    const currentLevel = userData.level || 1;
    const totalXP = userData.xp || 0;
    const xpForCurrentLevel = (currentLevel - 1) * 1000;
    const xpForNextLevel = currentLevel * 1000;
    const xpInCurrentLevel = totalXP - xpForCurrentLevel;
    const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
    const progressToNextLevel = Math.min(
      (xpInCurrentLevel / xpNeededForNextLevel) * 100,
      100
    );

    // Calculate days on platform
    const createdAt = userData.createdAt;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const totalDaysOnPlatform = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Format recent achievements
    const recentAchievements = userData.badges.map((badge) => ({
      id: badge.id,
      name: badge.name,
      type: badge.type,
      earnedAt: badge.earnedAt.toISOString(),
    }));

    const metrics = {
      coursesCompleted,
      totalXP,
      currentLevel,
      progressToNextLevel,
      completionRate,
      currentStreak: userData.streak || 0,
      longestStreak: userData.streak || 0, // TODO: Track longest streak separately
      recentAchievements,
      totalCoursesStarted,
      totalDaysOnPlatform,
    };

    return NextResponse.json(
      { success: true, data: metrics },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

