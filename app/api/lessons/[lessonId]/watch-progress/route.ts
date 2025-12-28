import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    // Await params in Next.js 14+ App Router
    const { lessonId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch lesson to get minimum watch time
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        minimumWatchTime: true,
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: "Lesson not found" },
        { status: 404 }
      );
    }

    // Get or create watch progress
    const watchProgress = await prisma.videoWatchProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lessonId,
        },
      },
      create: {
        userId: user.id,
        lessonId: lessonId,
        watchedSeconds: 0,
        isCompleted: false,
      },
      update: {},
    });

    const minimumWatchTime = lesson.minimumWatchTime || 0;
    const canTakeQuiz =
      watchProgress.watchedSeconds >= minimumWatchTime;

    return NextResponse.json(
      {
        success: true,
        data: {
          watchedSeconds: watchProgress.watchedSeconds,
          canTakeQuiz,
          minimumWatchTime,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching watch progress:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch watch progress",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    // Await params in Next.js 14+ App Router
    const { lessonId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const body = await request.json();
    const { watchedSeconds, isPlaying } = body;

    if (typeof watchedSeconds !== "number" || watchedSeconds < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid watchedSeconds" },
        { status: 400 }
      );
    }

    // Fetch lesson to get video duration and minimum watch time
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        videoDuration: true,
        minimumWatchTime: true,
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: "Lesson not found" },
        { status: 404 }
      );
    }

    // Calculate if video is completed (watched at least 90% of duration)
    const videoDuration = lesson.videoDuration || 0;
    const isCompleted =
      videoDuration > 0 && watchedSeconds >= videoDuration * 0.9;

    // Update or create watch progress
    const watchProgress = await prisma.videoWatchProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lessonId,
        },
      },
      create: {
        userId: user.id,
        lessonId: lessonId,
        watchedSeconds: watchedSeconds,
        isCompleted: isCompleted,
        lastWatchedAt: new Date(),
      },
      update: {
        watchedSeconds: watchedSeconds,
        isCompleted: isCompleted,
        lastWatchedAt: new Date(),
      },
    });

    const minimumWatchTime = lesson.minimumWatchTime || 0;
    const canTakeQuiz = watchedSeconds >= minimumWatchTime;

    return NextResponse.json(
      {
        success: true,
        data: {
          watchedSeconds: watchProgress.watchedSeconds,
          canTakeQuiz,
          isCompleted: watchProgress.isCompleted,
          minimumWatchTime,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating watch progress:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update watch progress",
      },
      { status: 500 }
    );
  }
}

