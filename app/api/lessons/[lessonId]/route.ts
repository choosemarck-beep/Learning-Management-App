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

    // Fetch lesson with video, module, course, and quiz task
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                isPublished: true,
              },
            },
          },
        },
        tasks: {
          where: {
            type: "quiz",
          },
          orderBy: {
            order: "asc",
          },
          take: 1, // Get first quiz task
        },
        videoWatchProgresses: {
          where: {
            userId: user.id,
          },
          take: 1,
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: "Lesson not found" },
        { status: 404 }
      );
    }

    // Check if course is published
    if (!lesson.module.course.isPublished) {
      return NextResponse.json(
        { success: false, error: "Course is not published" },
        { status: 403 }
      );
    }

    const watchProgress = lesson.videoWatchProgresses[0];
    const quizTask = lesson.tasks[0] || null;

    // Calculate if quiz can be taken
    const minimumWatchTime = lesson.minimumWatchTime || 0;
    const watchedSeconds = watchProgress?.watchedSeconds || 0;
    const canTakeQuiz = watchedSeconds >= minimumWatchTime;

    return NextResponse.json(
      {
        success: true,
        data: {
          lesson: {
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            videoUrl: lesson.videoUrl,
            videoDuration: lesson.videoDuration,
            minimumWatchTime: lesson.minimumWatchTime,
            videoThumbnail: lesson.videoThumbnail,
            order: lesson.order,
            totalXP: lesson.totalXP,
          },
          module: {
            id: lesson.module.id,
            title: lesson.module.title,
            order: lesson.module.order,
          },
          course: {
            id: lesson.module.course.id,
            title: lesson.module.course.title,
          },
          quizTask: quizTask
            ? {
                id: quizTask.id,
                title: quizTask.title,
                content: quizTask.content,
                xpReward: quizTask.xpReward,
              }
            : null,
          watchProgress: watchProgress
            ? {
                watchedSeconds: watchProgress.watchedSeconds,
                isCompleted: watchProgress.isCompleted,
                lastWatchedAt: watchProgress.lastWatchedAt,
              }
            : {
                watchedSeconds: 0,
                isCompleted: false,
                lastWatchedAt: null,
              },
          canTakeQuiz,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch lesson",
      },
      { status: 500 }
    );
  }
}

