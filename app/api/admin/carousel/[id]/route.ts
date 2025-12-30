import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export const dynamic = 'force-dynamic';

// PATCH - Update carousel image
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

    // Validate redirectUrl if provided (must be a valid URL)
    if (body.redirectUrl !== undefined && body.redirectUrl !== null && body.redirectUrl.trim() !== '') {
      try {
        new URL(body.redirectUrl);
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid redirect URL format" },
          { status: 400 }
        );
      }
    }

    // Wrap Prisma queries in try-catch
    try {
      const carouselImage = await prisma.carouselImage.update({
        where: { id },
        data: {
          title: body.title !== undefined ? body.title : undefined,
          description: body.description !== undefined ? body.description : undefined,
          redirectUrl: body.redirectUrl !== undefined ? (body.redirectUrl && body.redirectUrl.trim() !== '' ? body.redirectUrl.trim() : null) : undefined,
          order: body.order !== undefined ? body.order : undefined,
          isActive: body.isActive !== undefined ? body.isActive : undefined,
        },
      });

      return NextResponse.json(
        { success: true, data: carouselImage },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error updating carousel image:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to update carousel image" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in PATCH /api/admin/carousel/[id]:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// DELETE - Delete carousel image
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
      await prisma.carouselImage.delete({
        where: { id },
      });

      return NextResponse.json(
        { success: true, message: "Carousel image deleted successfully" },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error deleting carousel image:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to delete carousel image" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in DELETE /api/admin/carousel/[id]:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

