import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { announcementSchema } from "@/lib/validation/schemas";
import { z } from "zod";

export const dynamic = 'force-dynamic';

// GET - Fetch all announcements (admin)
export async function GET(request: NextRequest) {
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

    const announcements = await prisma.announcement.findMany({
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(
      { success: true, data: announcements },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new announcement
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = announcementSchema.parse(body);

    // Validate trainer exists if trainerId is provided
    if (validatedData.trainerId) {
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

    const announcement = await prisma.announcement.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        type: validatedData.type,
        trainerId: validatedData.trainerId || null,
        priority: validatedData.priority,
        expiresAt: validatedData.expiresAt
          ? new Date(validatedData.expiresAt)
          : null,
        isActive: validatedData.isActive,
        createdBy: currentUser.id,
      },
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
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating announcement:", error);
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

