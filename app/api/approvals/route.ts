import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const role = searchParams.get("role");

    // Build where clause based on user role
    const where: any = {};

    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    // Role-based filtering - users can only see approvals they're involved in
    if (user.role === "BRANCH_MANAGER") {
      // Branch Managers see approvals they created
      where.requestedBy = user.id;
    } else if (user.role === "AREA_MANAGER") {
      // Area Managers see approvals assigned to them
      where.areaManagerId = user.id;
    } else if (user.role === "REGIONAL_MANAGER") {
      // Regional Managers see approvals assigned to them
      where.regionalManagerId = user.id;
    } else if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      // Admins see all approvals
      // No additional filter needed
    } else {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Fetch approval requests
    const approvalRequests = await prisma.approvalRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeNumber: true,
            branch: true,
            position: {
              select: {
                title: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: approvalRequests,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching approvals:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

