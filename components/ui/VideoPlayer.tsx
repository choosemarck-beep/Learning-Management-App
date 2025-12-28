"use client";

import React, { useState, useEffect } from "react";
import { Play, Loader2 } from "lucide-react";
import styles from "./VideoPlayer.module.css";

export interface VideoPlayerProps {
  videoUrl: string;
  thumbnail?: string | null;
  title?: string;
  className?: string;
  autoplay?: boolean;
  controls?: boolean;
  onProgress?: (progress: number) => void; // 0-100
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  thumbnail,
  title,
  className,
  autoplay = false,
  controls = true,
  onProgress,
  onTimeUpdate,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<"youtube" | "vimeo" | "direct" | null>(null);

  useEffect(() => {
    if (!videoUrl) {
      setError("No video URL provided");
      return;
    }

    // Detect video type and generate embed URL
    const detected = detectVideoType(videoUrl);
    setVideoType(detected.type);
    setEmbedUrl(detected.embedUrl);
    setError(detected.error);
  }, [videoUrl]);

  const detectVideoType = (url: string): {
    type: "youtube" | "vimeo" | "direct" | null;
    embedUrl: string | null;
    error: string | null;
  } => {
    if (!url) {
      return { type: null, embedUrl: null, error: "No URL provided" };
    }

    // YouTube detection
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      const embedUrl = `https://www.youtube.com/embed/${videoId}${autoplay ? "?autoplay=1" : ""}`;
      return { type: "youtube", embedUrl, error: null };
    }

    // Vimeo detection
    const vimeoRegex = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      const videoId = vimeoMatch[1];
      const embedUrl = `https://player.vimeo.com/video/${videoId}${autoplay ? "?autoplay=1" : ""}`;
      return { type: "vimeo", embedUrl, error: null };
    }

    // Direct video URL (MP4, WebM, etc.)
    if (url.match(/\.(mp4|webm|ogg|mov|m3u8)(\?.*)?$/i)) {
      return { type: "direct", embedUrl: url, error: null };
    }

    return { type: null, embedUrl: null, error: "Unsupported video URL format" };
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError("Failed to load video");
  };

  if (error) {
    return (
      <div className={`${styles.container} ${className || ""}`}>
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>{error}</p>
          <p className={styles.errorSubtext}>Please check the video URL and try again.</p>
        </div>
      </div>
    );
  }

  if (!embedUrl || !videoType) {
    return (
      <div className={`${styles.container} ${className || ""}`}>
        <div className={styles.loadingContainer}>
          <Loader2 className={styles.spinner} />
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ""}`}>
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <Loader2 className={styles.spinner} />
        </div>
      )}
      <div className={styles.videoWrapper}>
        {videoType === "youtube" && (
          <iframe
            src={embedUrl}
            className={styles.videoIframe}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title || "YouTube video"}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
        {videoType === "vimeo" && (
          <iframe
            src={embedUrl}
            className={styles.videoIframe}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={title || "Vimeo video"}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
        {videoType === "direct" && (
          <video
            src={embedUrl}
            className={styles.videoElement}
            controls={controls}
            autoPlay={autoplay}
            onLoadedData={handleLoad}
            onError={handleError}
            onTimeUpdate={(e) => {
              const video = e.currentTarget;
              if (onTimeUpdate) {
                onTimeUpdate(video.currentTime, video.duration);
              }
              if (onProgress) {
                const progress = (video.currentTime / video.duration) * 100;
                onProgress(progress);
              }
            }}
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>
      {thumbnail && videoType === "direct" && isLoading && (
        <div
          className={styles.thumbnail}
          style={{ backgroundImage: `url(${thumbnail})` }}
        />
      )}
    </div>
  );
};

