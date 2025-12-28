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

    // Only managers can view training stats
    if (
      user.role !== "BRANCH_MANAGER" &&
      user.role !== "AREA_MANAGER" &&
      user.role !== "REGIONAL_MANAGER"
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get("role");
    const managerRole = roleParam || user.role;

    // Get manager's jurisdiction
    const manager = await prisma.user.findUnique({
      where: { id: user.id },
      select: { branch: true, area: true, region: true, role: true },
    });

    if (!manager) {
      return NextResponse.json(
        { success: false, error: "Manager not found" },
        { status: 404 }
      );
    }

    // Get team members based on manager role
    let whereClause: any = {
      status: "APPROVED",
      id: { not: user.id },
    };

    if (managerRole === "BRANCH_MANAGER") {
      if (!manager.branch) {
        return NextResponse.json(
          { success: true, data: { stats: [] } },
          { status: 200 }
        );
      }
      whereClause.branch = manager.branch;
      whereClause.role = "EMPLOYEE";
    } else if (managerRole === "AREA_MANAGER") {
      if (!manager.area) {
        return NextResponse.json(
          { success: true, data: { stats: [] } },
          { status: 200 }
        );
      }
      whereClause.area = manager.area;
      whereClause.role = "BRANCH_MANAGER";
    } else if (managerRole === "REGIONAL_MANAGER") {
      if (!manager.region) {
        return NextResponse.json(
          { success: true, data: { stats: [] } },
          { status: 200 }
        );
      }
      whereClause.region = manager.region;
      whereClause.role = "AREA_MANAGER";
    }

    const teamMembers = await prisma.user.findMany({
      where: whereClause,
      select: { id: true },
    });

    const teamMemberIds = teamMembers.map((m) => m.id);

    if (teamMemberIds.length === 0) {
      return NextResponse.json(
        { success: true, data: { stats: [] } },
        { status: 200 }
      );
    }

    // Get all course progress for team members
    const courseProgresses = await prisma.courseProgress.findMany({
      where: {
        userId: { in: teamMemberIds },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Get all published courses
    const allCourses = await prisma.course.findMany({
      where: { isPublished: true },
      select: { id: true, title: true },
    });

    // Calculate stats per course
    interface CourseStat {
      courseId: string;
      courseTitle: string;
      totalAssigned: number;
      completed: number;
      inProgress: number;
      notStarted: number;
      totalProgress: number;
      progressCount: number;
    }
    const statsMap = new Map<string, CourseStat>();

    // Initialize stats for all published courses
    allCourses.forEach((course) => {
      statsMap.set(course.id, {
        courseId: course.id,
        courseTitle: course.title,
        totalAssigned: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        totalProgress: 0,
        progressCount: 0,
      });
    });

    // Process course progress
    courseProgresses.forEach((cp) => {
      const stat = statsMap.get(cp.courseId);
      if (stat) {
        stat.totalAssigned++;
        stat.totalProgress += cp.progress;
        stat.progressCount++;

        if (cp.isCompleted) {
          stat.completed++;
        } else if (cp.progress > 0) {
          stat.inProgress++;
        } else {
          stat.notStarted++;
        }
      }
    });

    // Calculate averages and format
    const stats = Array.from(statsMap.values())
      .map((stat: CourseStat) => ({
        courseId: stat.courseId,
        courseTitle: stat.courseTitle,
        totalAssigned: stat.totalAssigned,
        completed: stat.completed,
        inProgress: stat.inProgress,
        notStarted: stat.notStarted,
        averageProgress:
          stat.progressCount > 0
            ? stat.totalProgress / stat.progressCount
            : 0,
      }))
      .filter((stat) => stat.totalAssigned > 0) // Only show courses with assigned members
      .sort((a, b) => b.totalAssigned - a.totalAssigned); // Sort by total assigned

    return NextResponse.json(
      {
        success: true,
        data: { stats },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Training stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

