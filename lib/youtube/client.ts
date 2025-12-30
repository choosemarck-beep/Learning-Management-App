import { google } from 'googleapis';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string;
  videoUrl: string;
  duration: number | null;
  publishedAt: string;
}

/**
 * Extract playlist ID from various YouTube playlist URL formats
 * Supports:
 * - https://www.youtube.com/playlist?list=PLxxx
 * - https://youtube.com/playlist?list=PLxxx
 * - https://youtu.be/xxx?list=PLxxx
 * - PLxxx (direct ID)
 */
export function extractPlaylistId(urlOrId: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') {
    return null;
  }

  // If it's already just an ID (starts with PL), return it
  if (urlOrId.startsWith('PL') && urlOrId.length > 2) {
    return urlOrId;
  }

  // Try to extract from URL
  try {
    const url = new URL(urlOrId);
    const playlistId = url.searchParams.get('list');
    if (playlistId) {
      return playlistId;
    }
  } catch (error) {
    // Not a valid URL, might be just an ID
    if (urlOrId.startsWith('PL')) {
      return urlOrId;
    }
  }

  return null;
}

/**
 * Fetch videos from a YouTube playlist using YouTube Data API v3
 * @param playlistId - YouTube playlist ID (e.g., "PLrAXtmRdnEQy6nuLMH")
 * @param maxResults - Maximum number of videos to fetch (default: 50, max: 50)
 * @returns Array of YouTube videos
 */
export async function fetchPlaylistVideos(
  playlistId: string,
  maxResults: number = 50
): Promise<YouTubeVideo[]> {
  if (!process.env.YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY environment variable is not set');
  }

  if (!playlistId || typeof playlistId !== 'string') {
    throw new Error('Playlist ID is required');
  }

  try {
    // Initialize YouTube API client with API key
    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });

    // First, get playlist items (videos in the playlist)
    const playlistItemsResponse = await youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      playlistId: playlistId,
      maxResults: Math.min(maxResults, 50), // YouTube API max is 50
    });

    if (!playlistItemsResponse.data.items || playlistItemsResponse.data.items.length === 0) {
      return [];
    }

    // Extract video IDs from playlist items
    const videoIds = playlistItemsResponse.data.items
      .map((item) => item.contentDetails?.videoId)
      .filter((id): id is string => !!id);

    if (videoIds.length === 0) {
      return [];
    }

    // Fetch video details (title, description, thumbnails, duration)
    const videosResponse = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: videoIds,
      maxResults: videoIds.length,
    });

    if (!videosResponse.data.items) {
      return [];
    }

    // Transform YouTube API response to our YouTubeVideo format
    const videos: YouTubeVideo[] = videosResponse.data.items.map((item) => {
      const snippet = item.snippet;
      const contentDetails = item.contentDetails;
      const videoId = item.id;

      // Parse duration (ISO 8601 format: PT1H2M10S)
      let duration: number | null = null;
      if (contentDetails?.duration) {
        const match = contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (match) {
          const hours = parseInt(match[1] || '0', 10);
          const minutes = parseInt(match[2] || '0', 10);
          const seconds = parseInt(match[3] || '0', 10);
          duration = hours * 3600 + minutes * 60 + seconds;
        }
      }

      // Get thumbnail (prefer high quality, fallback to default)
      const thumbnail =
        snippet?.thumbnails?.maxres?.url ||
        snippet?.thumbnails?.high?.url ||
        snippet?.thumbnails?.medium?.url ||
        snippet?.thumbnails?.default?.url ||
        '';

      return {
        id: videoId || '',
        title: snippet?.title || 'Untitled',
        description: snippet?.description || null,
        thumbnail: thumbnail,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        duration: duration,
        publishedAt: snippet?.publishedAt || new Date().toISOString(),
      };
    });

    return videos;
  } catch (error: any) {
    console.error('[YouTube] Error fetching playlist videos:', {
      playlistId,
      error: error?.message,
      code: error?.code,
      response: error?.response?.data,
    });

    // Handle specific YouTube API errors
    if (error?.code === 404) {
      throw new Error('Playlist not found. Please check the playlist ID.');
    }
    if (error?.code === 403) {
      throw new Error('YouTube API access denied. Please check your API key and quota.');
    }
    if (error?.code === 400) {
      throw new Error('Invalid playlist ID or request parameters.');
    }

    throw new Error(
      `Failed to fetch videos from YouTube playlist: ${error?.message || 'Unknown error'}`
    );
  }
}

/**
 * Validate YouTube playlist URL format
 */
export function validatePlaylistUrl(url: string): boolean {
  const playlistId = extractPlaylistId(url);
  return playlistId !== null && playlistId.length > 0;
}

