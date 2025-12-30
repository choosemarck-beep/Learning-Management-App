import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get carousel settings
    const settings = await prisma.carouselSettings.findFirst();

    if (!settings) {
      // Return empty if no settings (default to photo carousel)
      const images = await prisma.carouselImage.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          order: "asc",
        },
        select: {
          id: true,
          imageUrl: true,
          title: true,
          description: true,
          redirectUrl: true,
        },
        take: 4, // Limit to 4 photos for photo carousel
      });

      return NextResponse.json(
        { success: true, data: { mode: "PHOTO_CAROUSEL", images, videoUrl: null } },
        { status: 200 }
      );
    }

    if (settings.mode === "VIDEO") {
      // Video mode - return video URL
      return NextResponse.json(
        {
          success: true,
          data: {
            mode: "VIDEO",
            videoUrl: settings.videoUrl,
            images: [],
          },
        },
        { status: 200 }
      );
    } else {
      // Photo carousel mode - return up to 4 active images
      const images = await prisma.carouselImage.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          order: "asc",
        },
        select: {
          id: true,
          imageUrl: true,
          title: true,
          description: true,
          redirectUrl: true,
        },
        take: 4, // Limit to 4 photos
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            mode: "PHOTO_CAROUSEL",
            images,
            videoUrl: null,
          },
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error fetching carousel:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

