import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { calculateCourseProgress, updateCourseProgress } from "@/lib/utils/trainingProgress";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    // Await params in Next.js 14+ App Router
    const { courseId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        isPublished: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    // Calculate course progress
    const calculated = await calculateCourseProgress(user.id, courseId);

    // Update or create course progress (auto-enrollment)
    await updateCourseProgress(user.id, courseId);

    // Fetch updated record
    const courseProgressRecord = await prisma.courseProgress.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          progress: calculated.progress,
          isCompleted: calculated.isCompleted,
          completedTrainings: calculated.completedTrainings,
          totalTrainings: calculated.totalTrainings,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching course progress:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch course progress",
      },
      { status: 500 }
    );
  }
}

