/**
 * Video Utilities
 * Functions for detecting and converting video URLs (YouTube, Vimeo, direct video files)
 */

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://youtube.com/v/VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // YouTube watch URL: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([^"&?\/\s]{11})/);
  if (watchMatch) {
    return watchMatch[1];
  }

  // YouTube short URL: https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/(?:youtu\.be\/)([^"&?\/\s]{11})/);
  if (shortMatch) {
    return shortMatch[1];
  }

  // YouTube embed URL: https://www.youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/(?:youtube\.com\/embed\/)([^"&?\/\s]{11})/);
  if (embedMatch) {
    return embedMatch[1];
  }

  // YouTube v URL: https://youtube.com/v/VIDEO_ID
  const vMatch = url.match(/(?:youtube\.com\/v\/)([^"&?\/\s]{11})/);
  if (vMatch) {
    return vMatch[1];
  }

  return null;
}

/**
 * Extract Vimeo video ID from URL
 * Supports:
 * - https://vimeo.com/VIDEO_ID
 * - https://player.vimeo.com/video/VIDEO_ID
 */
export function extractVimeoVideoId(url: string): string | null {
  if (!url) return null;

  // Vimeo URL: https://vimeo.com/VIDEO_ID
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(?:.*\/)?(\d+)/);
  if (vimeoMatch) {
    return vimeoMatch[1];
  }

  return null;
}

/**
 * Check if URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}

/**
 * Check if URL is a Vimeo URL
 */
export function isVimeoUrl(url: string): boolean {
  return extractVimeoVideoId(url) !== null;
}

/**
 * Check if URL is a direct video file (MP4, WebM, etc.)
 */
export function isDirectVideoUrl(url: string): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(url);
}

/**
 * Convert YouTube URL to embed URL
 * Returns: https://www.youtube.com/embed/VIDEO_ID
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Convert Vimeo URL to embed URL
 * Returns: https://player.vimeo.com/video/VIDEO_ID
 */
export function getVimeoEmbedUrl(url: string): string | null {
  const videoId = extractVimeoVideoId(url);
  if (!videoId) return null;
  return `https://player.vimeo.com/video/${videoId}`;
}

/**
 * Get video embed URL for any supported video platform
 * Returns embed URL for YouTube/Vimeo, or original URL for direct video files
 */
export function getVideoEmbedUrl(url: string | null): string | null {
  if (!url) return null;

  // Try YouTube first
  const youtubeEmbed = getYouTubeEmbedUrl(url);
  if (youtubeEmbed) return youtubeEmbed;

  // Try Vimeo
  const vimeoEmbed = getVimeoEmbedUrl(url);
  if (vimeoEmbed) return vimeoEmbed;

  // Direct video file - return as-is
  if (isDirectVideoUrl(url)) {
    return url;
  }

  // Unknown format - return null
  return null;
}

/**
 * Get video type (youtube, vimeo, direct, unknown)
 */
export function getVideoType(url: string | null): "youtube" | "vimeo" | "direct" | "unknown" {
  if (!url) return "unknown";
  if (isYouTubeUrl(url)) return "youtube";
  if (isVimeoUrl(url)) return "vimeo";
  if (isDirectVideoUrl(url)) return "direct";
  return "unknown";
}

