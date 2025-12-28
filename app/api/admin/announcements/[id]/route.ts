import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { announcementUpdateSchema } from "@/lib/validation/schemas";
import { z } from "zod";

// PATCH - Update announcement
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    
    // Validate request body
    let validatedData;
    try {
      validatedData = announcementUpdateSchema.parse(body);
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

    // Validate trainer exists if trainerId is provided
    if (validatedData.trainerId !== undefined && validatedData.trainerId !== null) {
      const trainer = await prisma.user.findUnique({
        where: { id: validatedData.trainerId },
        select: { role: true },
      });

      if (!trainer || trainer.role !== "TRAINER") {
        return NextResponse.json(
          { success: false, error: "Invalid trainer ID" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.content !== undefined) updateData.content = validatedData.content;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.trainerId !== undefined) updateData.trainerId = validatedData.trainerId;
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority;
    if (validatedData.expiresAt !== undefined) {
      updateData.expiresAt = validatedData.expiresAt
        ? new Date(validatedData.expiresAt)
        : null;
    }
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

    const announcement = await prisma.announcement.update({
      where: { id },
      data: updateData,
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: announcement },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating announcement:", error);
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
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete announcement
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = params;

    await prisma.announcement.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: "Announcement deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

