import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";

// GET - Fetch carousel settings
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
  } catch (error) {
    console.error("Error fetching carousel settings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update carousel settings
export async function PATCH(request: NextRequest) {
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
    const { mode, videoUrl } = body;

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
  } catch (error) {
    console.error("Error updating carousel settings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

