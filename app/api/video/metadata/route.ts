import { NextRequest, NextResponse } from "next/server";
import { extractYouTubeVideoId, extractVimeoVideoId, isDirectVideoUrl } from "@/lib/utils/videoUtils";

/**
 * API endpoint to fetch video metadata (duration) from various sources
 * Supports: YouTube, Vimeo, and direct video files
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoUrl } = body;

    if (!videoUrl || typeof videoUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "Video URL is required" },
        { status: 400 }
      );
    }

    // Try YouTube first
    const youtubeVideoId = extractYouTubeVideoId(videoUrl);
    if (youtubeVideoId) {
      try {
        // Use YouTube oEmbed API (no API key required, but limited info)
        // For duration, we'll use YouTube Data API v3 if available, or oEmbed as fallback
        const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeVideoId}&format=json`;
        const oEmbedResponse = await fetch(oEmbedUrl);
        
        if (oEmbedResponse.ok) {
          const oEmbedData = await oEmbedResponse.json();
          // oEmbed doesn't provide duration, so we'll need to use a different approach
          // For now, we'll return null and let the client handle it
          // Alternatively, we could use YouTube Data API v3 if API key is available
        }

        // Try YouTube Data API v3 if API key is available
        const youtubeApiKey = process.env.YOUTUBE_API_KEY;
        if (youtubeApiKey) {
          const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${youtubeVideoId}&part=contentDetails&key=${youtubeApiKey}`;
          const apiResponse = await fetch(apiUrl);
          
          if (apiResponse.ok) {
            const apiData = await apiResponse.json();
            if (apiData.items && apiData.items.length > 0) {
              const duration = apiData.items[0].contentDetails.duration;
              // Parse ISO 8601 duration (e.g., "PT1H2M10S")
              const seconds = parseISO8601Duration(duration);
              if (seconds > 0) {
                return NextResponse.json({
                  success: true,
                  duration: seconds,
                  source: "youtube",
                });
              }
            }
          }
        }

        // Fallback: Return null and let client-side detection handle it
        return NextResponse.json({
          success: true,
          duration: null,
          source: "youtube",
          message: "Duration detection requires YouTube Data API key or client-side detection",
        });
      } catch (error) {
        console.error("Error fetching YouTube metadata:", error);
        return NextResponse.json({
          success: false,
          error: "Failed to fetch YouTube video metadata",
        }, { status: 500 });
      }
    }

    // Try Vimeo
    const vimeoVideoId = extractVimeoVideoId(videoUrl);
    if (vimeoVideoId) {
      try {
        const vimeoUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoUrl)}`;
        const vimeoResponse = await fetch(vimeoUrl);
        
        if (vimeoResponse.ok) {
          const vimeoData = await vimeoResponse.json();
          // Vimeo oEmbed doesn't provide duration in standard response
          // We need to use Vimeo API v3 for duration
          const vimeoApiToken = process.env.VIMEO_API_TOKEN;
          if (vimeoApiToken) {
            const apiUrl = `https://api.vimeo.com/videos/${vimeoVideoId}`;
            const apiResponse = await fetch(apiUrl, {
              headers: {
                Authorization: `Bearer ${vimeoApiToken}`,
              },
            });
            
            if (apiResponse.ok) {
              const apiData = await apiResponse.json();
              const duration = apiData.duration;
              if (duration && duration > 0) {
                return NextResponse.json({
                  success: true,
                  duration: duration,
                  source: "vimeo",
                });
              }
            }
          }

          return NextResponse.json({
            success: true,
            duration: null,
            source: "vimeo",
            message: "Duration detection requires Vimeo API token or client-side detection",
          });
        }
      } catch (error) {
        console.error("Error fetching Vimeo metadata:", error);
        return NextResponse.json({
          success: false,
          error: "Failed to fetch Vimeo video metadata",
        }, { status: 500 });
      }
    }

    // Direct video file - client-side detection required
    if (isDirectVideoUrl(videoUrl)) {
      return NextResponse.json({
        success: true,
        duration: null,
        source: "direct",
        message: "Duration must be detected client-side for direct video files",
      });
    }

    return NextResponse.json({
      success: false,
      error: "Unsupported video URL format",
    }, { status: 400 });

  } catch (error) {
    console.error("Error in video metadata endpoint:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Parse ISO 8601 duration string to seconds
 * Example: "PT1H2M10S" -> 3730 seconds
 */
function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

