import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { announcementUpdateSchema } from "@/lib/validation/schemas";
import { z } from "zod";

export const dynamic = 'force-dynamic';

// PATCH - Update announcement
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Wrap getCurrentUser in try-catch
    let currentUser;
    try {
      currentUser = await getCurrentUser();
    } catch (authError) {
      console.error("Error getting current user:", authError);
      return NextResponse.json(
        { success: false, error: "Authentication error" },
        { status: 401 }
      );
    }

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
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }
    
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

    // Wrap Prisma queries in try-catch
    try {
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
    } catch (dbError) {
      console.error("Database error updating announcement:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to update announcement" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in PATCH /api/admin/announcements/[id]:", error);
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
      { success: false, error: "An unexpected error occurred" },
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
    // Wrap getCurrentUser in try-catch
    let currentUser;
    try {
      currentUser = await getCurrentUser();
    } catch (authError) {
      console.error("Error getting current user:", authError);
      return NextResponse.json(
        { success: false, error: "Authentication error" },
        { status: 401 }
      );
    }

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

    // Wrap Prisma queries in try-catch
    try {
      await prisma.announcement.delete({
        where: { id },
      });

      return NextResponse.json(
        { success: true, message: "Announcement deleted successfully" },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error deleting announcement:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to delete announcement" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in DELETE /api/admin/announcements/[id]:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

