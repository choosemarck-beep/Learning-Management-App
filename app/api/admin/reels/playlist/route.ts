import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { extractPlaylistId, validatePlaylistUrl } from "@/lib/youtube/client";

export const dynamic = 'force-dynamic';

/**
 * GET - Fetch current playlist settings
 */
export async function GET(request: NextRequest) {
  try {
    let user;
    try {
      user = await getCurrentUser();
    } catch (authError) {
      console.error("[Reels Playlist] Error getting current user:", authError);
      return NextResponse.json(
        { success: false, error: "Authentication error" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    try {
      const settings = await prisma.reelsPlaylistSettings.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: "desc" },
        include: {
          updater: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!settings) {
        return NextResponse.json(
          {
            success: true,
            data: {
              playlistUrl: null,
              youtubePlaylistId: null,
              isActive: false,
            },
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            playlistUrl: settings.playlistUrl,
            youtubePlaylistId: settings.youtubePlaylistId,
            isActive: settings.isActive,
            updatedAt: settings.updatedAt.toISOString(),
            updatedBy: {
              id: settings.updater.id,
              name: settings.updater.name,
              email: settings.updater.email,
            },
          },
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("[Reels Playlist] Database error:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch playlist settings" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Reels Playlist] Unexpected error in GET:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update playlist URL (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    let user;
    try {
      user = await getCurrentUser();
    } catch (authError) {
      console.error("[Reels Playlist] Error getting current user:", authError);
      return NextResponse.json(
        { success: false, error: "Authentication error" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { playlistUrl } = body;

    if (!playlistUrl || typeof playlistUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: "Playlist URL is required" },
        { status: 400 }
      );
    }

    // Validate playlist URL format
    if (!validatePlaylistUrl(playlistUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid YouTube playlist URL format. Please provide a valid YouTube playlist URL.",
        },
        { status: 400 }
      );
    }

    // Extract playlist ID
    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not extract playlist ID from URL. Please check the URL format.",
        },
        { status: 400 }
      );
    }

    try {
      // Deactivate all existing settings
      await prisma.reelsPlaylistSettings.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // Check if settings with this playlist ID already exists
      const existingSettings = await prisma.reelsPlaylistSettings.findFirst({
        where: { youtubePlaylistId: playlistId },
      });

      let settings;
      if (existingSettings) {
        // Update existing settings
        settings = await prisma.reelsPlaylistSettings.update({
          where: { id: existingSettings.id },
          data: {
            youtubePlaylistId: playlistId,
            playlistUrl: playlistUrl,
            isActive: true,
            updatedBy: user.id,
          },
        });
      } else {
        // Create new settings
        settings = await prisma.reelsPlaylistSettings.create({
          data: {
            youtubePlaylistId: playlistId,
            playlistUrl: playlistUrl,
            isActive: true,
            updatedBy: user.id,
          },
        });
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            playlistUrl: settings.playlistUrl,
            youtubePlaylistId: settings.youtubePlaylistId,
            isActive: settings.isActive,
            updatedAt: settings.updatedAt.toISOString(),
          },
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("[Reels Playlist] Database error:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to update playlist settings" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Reels Playlist] Unexpected error in PATCH:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

