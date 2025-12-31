import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export const dynamic = 'force-dynamic';

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

    if (userId !== currentUser.id && currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        courseProgresses: {
          where: { isCompleted: true },
          select: { createdAt: true },
          orderBy: { createdAt: "asc" },
        },
        badges: {
          select: { earnedAt: true },
          orderBy: { earnedAt: "asc" },
        },
      },
    });

    if (!userData) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const createdAt = userData.createdAt;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const totalDaysOnPlatform = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const firstCourseDate = userData.courseProgresses[0]?.createdAt.toISOString() || null;
    const firstBadgeDate = userData.badges[0]?.earnedAt.toISOString() || null;

    const stats = {
      totalDaysOnPlatform,
      totalCoursesCompleted: userData.courseProgresses.length,
      totalXP: userData.xp || 0,
      currentLevel: userData.level || 1,
      currentRank: userData.rank || "Stellar Cadet",
      badgesEarned: userData.badges.length,
      longestStreak: userData.streak || 0,
      firstCourseDate,
      firstBadgeDate,
      levelUpCount: (userData.level || 1) - 1,
    };

    return NextResponse.json(
      { success: true, data: stats },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching journey stats:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

