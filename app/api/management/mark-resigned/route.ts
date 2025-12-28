import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only Branch Managers can mark employees as resigned (requires approval)
    if (user.role !== "BRANCH_MANAGER") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Only Branch Managers can request employee resignation" },
        { status: 403 }
      );
    }

    const { employeeId, password, comment } = await request.json();

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "Employee ID is required" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required for security verification" },
        { status: 400 }
      );
    }

    // Verify password
    const manager = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true, branch: true, area: true },
    });

    if (!manager || !manager.password) {
      return NextResponse.json(
        { success: false, error: "Manager account not found" },
        { status: 404 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, manager.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid password" },
        { status: 401 }
      );
    }

    // Get the employee to verify they're under this manager
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branch: true,
        area: true,
        region: true,
        status: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    // Verify the employee is under this branch manager's jurisdiction
    if (employee.role !== "EMPLOYEE" || employee.branch !== manager.branch) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to manage this employee" },
        { status: 403 }
      );
    }

    // Check if employee is already resigned or has a pending approval request
    if (employee.status === "RESIGNED") {
      return NextResponse.json(
        { success: false, error: "Employee is already marked as resigned" },
        { status: 400 }
      );
    }

    // Check for existing pending approval request
    const existingRequest = await prisma.approvalRequest.findFirst({
      where: {
        employeeId,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: "There is already a pending resignation approval request for this employee" },
        { status: 400 }
      );
    }

    // Find Area Manager (direct manager of Branch Manager)
    const areaManager = await prisma.user.findFirst({
      where: {
        role: "AREA_MANAGER",
        area: manager.area,
        status: "APPROVED",
      },
      select: { id: true },
    });

    if (!areaManager) {
      return NextResponse.json(
        { success: false, error: "Area Manager not found. Cannot create approval request." },
        { status: 404 }
      );
    }

    // Find Regional Manager (direct manager of Area Manager)
    const areaManagerData = await prisma.user.findUnique({
      where: { id: areaManager.id },
      select: { region: true },
    });

    const regionalManager = areaManagerData?.region
      ? await prisma.user.findFirst({
          where: {
            role: "REGIONAL_MANAGER",
            region: areaManagerData.region,
            status: "APPROVED",
          },
          select: { id: true },
        })
      : null;

    // Find any Admin (for final approval)
    const admin = await prisma.user.findFirst({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
        status: "APPROVED",
      },
      select: { id: true },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin not found. Cannot create approval request." },
        { status: 404 }
      );
    }

    // Create approval request
    const approvalRequest = await prisma.approvalRequest.create({
      data: {
        employeeId,
        requestedBy: user.id,
        requestComment: comment || null,
        areaManagerId: areaManager.id,
        regionalManagerId: regionalManager?.id || null,
        adminId: admin.id,
        status: "PENDING",
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeNumber: true,
          },
        },
        areaManager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        regionalManager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Resignation approval request created successfully. It will be reviewed by Area Manager, Regional Manager, and Admin.",
        data: {
          approvalRequestId: approvalRequest.id,
          employee: approvalRequest.employee,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Mark resigned error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

