import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

export const dynamic = 'force-dynamic';

// GET - Fetch carousel settings
export async function GET(request: NextRequest) {
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

    // Wrap Prisma queries in try-catch
    try {
      // Get or create settings (singleton)
      let settings = await prisma.carouselSettings.findFirst();

      if (!settings) {
        // Create default settings
        settings = await prisma.carouselSettings.create({
          data: {
            mode: "PHOTO_CAROUSEL",
            updatedBy: currentUser.id,
          },
        });
      }

      return NextResponse.json(
        { success: true, data: settings },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error fetching carousel settings:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch carousel settings" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/carousel/settings:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// PATCH - Update carousel settings
export async function PATCH(request: NextRequest) {
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

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { mode, videoUrl } = body;

    // Wrap Prisma queries in try-catch
    try {
      // Get or create settings
      let settings = await prisma.carouselSettings.findFirst();

      if (!settings) {
        settings = await prisma.carouselSettings.create({
          data: {
            mode: mode || "PHOTO_CAROUSEL",
            videoUrl: videoUrl || null,
            updatedBy: currentUser.id,
          },
        });
      } else {
        settings = await prisma.carouselSettings.update({
          where: { id: settings.id },
          data: {
            mode: mode || settings.mode,
            videoUrl: videoUrl !== undefined ? videoUrl : settings.videoUrl,
            updatedBy: currentUser.id,
          },
        });
      }

      return NextResponse.json(
        { success: true, data: settings },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error updating carousel settings:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to update carousel settings" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in PATCH /api/admin/carousel/settings:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

