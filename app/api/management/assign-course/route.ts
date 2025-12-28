import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only managers can assign courses
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

    const { courseId, employeeIds } = await request.json();

    if (!courseId || !employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Course ID and employee IDs are required" },
        { status: 400 }
      );
    }

    // Verify course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, isPublished: true },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    if (!course.isPublished) {
      return NextResponse.json(
        { success: false, error: "Course is not published" },
        { status: 400 }
      );
    }

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

    // Verify all employees are under this manager's jurisdiction
    let whereClause: any = {
      id: { in: employeeIds },
      status: "APPROVED",
    };

    if (manager.role === "BRANCH_MANAGER") {
      whereClause.branch = manager.branch;
      whereClause.role = "EMPLOYEE";
    } else if (manager.role === "AREA_MANAGER") {
      whereClause.area = manager.area;
      whereClause.role = "BRANCH_MANAGER";
    } else if (manager.role === "REGIONAL_MANAGER") {
      whereClause.region = manager.region;
      whereClause.role = "AREA_MANAGER";
    }

    const validEmployees = await prisma.user.findMany({
      where: whereClause,
      select: { id: true },
    });

    if (validEmployees.length !== employeeIds.length) {
      return NextResponse.json(
        { success: false, error: "Some employees are not under your management" },
        { status: 403 }
      );
    }

    // Create course progress records for each employee (if they don't exist)
    const assignments = await Promise.all(
      employeeIds.map((employeeId: string) =>
        prisma.courseProgress.upsert({
          where: {
            userId_courseId: {
              userId: employeeId,
              courseId: courseId,
            },
          },
          update: {}, // Don't update if already exists
          create: {
            userId: employeeId,
            courseId: courseId,
            progress: 0,
            isCompleted: false,
          },
        })
      )
    );

    return NextResponse.json(
      {
        success: true,
        message: `Course assigned to ${assignments.length} employee(s)`,
        data: { assignments: assignments.length },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Assign course error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

