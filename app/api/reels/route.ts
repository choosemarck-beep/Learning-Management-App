import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { prisma } from "@/lib/prisma/client";
import { fetchPlaylistVideos } from "@/lib/youtube/client";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if YouTube playlist is configured
    const playlistSettings = await prisma.reelsPlaylistSettings.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    // If playlist is configured, fetch from YouTube
    if (playlistSettings && playlistSettings.youtubePlaylistId) {
      try {
        const youtubeVideos = await fetchPlaylistVideos(playlistSettings.youtubePlaylistId);

        // Transform YouTube videos to match existing Video interface format
        const videos = youtubeVideos.map((video) => ({
          id: video.id,
          title: video.title,
          description: video.description,
          videoUrl: video.videoUrl,
          thumbnail: video.thumbnail || null,
          duration: video.duration,
          category: null, // YouTube videos don't have categories in our system
          views: 0, // YouTube API doesn't return views in playlistItems
          createdAt: new Date(video.publishedAt),
        }));

        // Apply search filter if provided
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        let filteredVideos = videos;

        if (search) {
          const searchLower = search.toLowerCase();
          filteredVideos = videos.filter(
            (video) =>
              video.title.toLowerCase().includes(searchLower) ||
              (video.description && video.description.toLowerCase().includes(searchLower))
          );
        }

        // Categories are not applicable for YouTube playlists
        return NextResponse.json(
          {
            success: true,
            data: {
              videos: filteredVideos,
              categories: [], // YouTube playlists don't have categories
            },
          },
          { status: 200 }
        );
      } catch (youtubeError: any) {
        console.error("[Reels] Error fetching from YouTube:", {
          error: youtubeError?.message,
          playlistId: playlistSettings.youtubePlaylistId,
        });

        // If YouTube API fails, return empty array with error message
        return NextResponse.json(
          {
            success: true,
            data: {
              videos: [],
              categories: [],
            },
            error: youtubeError?.message || "Failed to fetch videos from YouTube playlist",
          },
          { status: 200 } // Return 200 to avoid breaking frontend, but include error in response
        );
      }
    }

    // Fallback: Return empty array if no playlist is configured
    // This maintains backward compatibility with existing frontend
    return NextResponse.json(
      {
        success: true,
        data: {
          videos: [],
          categories: [],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Reels] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch videos",
      },
      { status: 500 }
    );
  }
}

