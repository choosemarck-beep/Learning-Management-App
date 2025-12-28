import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { rejectionActionSchema } from "@/lib/validation/schemas";
import { z } from "zod";

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
      validatedData = rejectionActionSchema.parse(body);
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

    // Check authorization - any approver in the chain can reject
    const isAuthorized =
      (user.role === "AREA_MANAGER" && approvalRequest.areaManagerId === user.id) ||
      (user.role === "REGIONAL_MANAGER" && approvalRequest.regionalManagerId === user.id) ||
      (user.role === "ADMIN" || user.role === "SUPER_ADMIN");

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to reject this request" },
        { status: 403 }
      );
    }

    // Update approval request to rejected
    const updatedRequest = await prisma.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: "REJECTED",
        rejectedBy: user.id,
        rejectedAt: new Date(),
        rejectionReason: validatedData.reason.trim(),
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
        message: "Approval request rejected successfully",
        data: updatedRequest,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Rejection error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

