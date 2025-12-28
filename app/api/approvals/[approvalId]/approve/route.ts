import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { approvalId: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { approvalId } = params;
    const body = await request.json();

    // Validate request body
    let validatedData;
    try {
      validatedData = approvalActionSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation error",
            details: error.errors,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Get the approval request
    const approvalRequest = await prisma.approvalRequest.findUnique({
      where: { id: approvalId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
        areaManager: {
          select: {
            id: true,
            area: true,
          },
        },
        regionalManager: {
          select: {
            id: true,
            region: true,
          },
        },
        admin: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!approvalRequest) {
      return NextResponse.json(
        { success: false, error: "Approval request not found" },
        { status: 404 }
      );
    }

    if (approvalRequest.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "This approval request is no longer pending" },
        { status: 400 }
      );
    }

    // Determine which approval level this user is at
    let isAuthorized = false;
    let approvalLevel = "";

    if (user.role === "AREA_MANAGER" && approvalRequest.areaManagerId === user.id) {
      isAuthorized = true;
      approvalLevel = "areaManager";
    } else if (user.role === "REGIONAL_MANAGER" && approvalRequest.regionalManagerId === user.id) {
      // Check if Area Manager has already approved
      if (!approvalRequest.areaManagerApproved) {
        return NextResponse.json(
          { success: false, error: "Area Manager must approve first" },
          { status: 403 }
        );
      }
      isAuthorized = true;
      approvalLevel = "regionalManager";
    } else if ((user.role === "ADMIN" || user.role === "SUPER_ADMIN") && approvalRequest.adminId === user.id) {
      // Check if Area Manager and Regional Manager have approved
      if (!approvalRequest.areaManagerApproved) {
        return NextResponse.json(
          { success: false, error: "Area Manager must approve first" },
          { status: 403 }
        );
      }
      if (approvalRequest.regionalManagerId && !approvalRequest.regionalManagerApproved) {
        return NextResponse.json(
          { success: false, error: "Regional Manager must approve first" },
          { status: 403 }
        );
      }
      isAuthorized = true;
      approvalLevel = "admin";
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to approve this request" },
        { status: 403 }
      );
    }

    // Update approval based on level
    const updateData: any = {};

    if (approvalLevel === "areaManager") {
      updateData.areaManagerApproved = true;
      updateData.areaManagerApprovedAt = new Date();
      updateData.areaManagerComment = validatedData.comment || null;
    } else if (approvalLevel === "regionalManager") {
      updateData.regionalManagerApproved = true;
      updateData.regionalManagerApprovedAt = new Date();
      updateData.regionalManagerComment = validatedData.comment || null;
    } else if (approvalLevel === "admin") {
      updateData.adminApproved = true;
      updateData.adminApprovedAt = new Date();
      updateData.adminComment = validatedData.comment || null;
      updateData.status = "APPROVED";
      
      // Update employee status to RESIGNED
      await prisma.user.update({
        where: { id: approvalRequest.employeeId },
        data: {
          status: "RESIGNED",
          updatedAt: new Date(),
        },
      });
    }

    // Update approval request
    const updatedRequest = await prisma.approvalRequest.update({
      where: { id: approvalId },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeNumber: true,
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
    });

    return NextResponse.json(
      {
        success: true,
        message: `Approval ${approvalLevel} completed successfully`,
        data: updatedRequest,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Approval error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

