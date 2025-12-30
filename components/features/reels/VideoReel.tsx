"use client";

import React, { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { Video } from "./ReelsPageClient";
import styles from "./VideoReel.module.css";

interface VideoReelProps {
  video: Video;
  isActive: boolean;
  onNext: () => void;
  onPrevious: () => void;
}

// Detect if video URL is YouTube and convert to embed URL
const getVideoEmbedUrl = (videoUrl: string): { isYouTube: boolean; embedUrl: string } => {
  if (!videoUrl) {
    return { isYouTube: false, embedUrl: videoUrl };
  }

  // Check if it's a YouTube URL
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = videoUrl.match(youtubeRegex);
  
  if (match && match[1]) {
    const videoId = match[1];
    // Get origin for security (client-side)
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    // YouTube embed URL with mobile-optimized parameters
    // enablejsapi=1: Enables JavaScript API for better mobile control
    // origin: Security parameter for iframe communication
    const params = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      loop: "1",
      playlist: videoId,
      controls: "1",
      modestbranding: "1",
      rel: "0",
      playsinline: "1",
      enablejsapi: "1",
      ...(origin ? { origin } : {}),
    });
    return {
      isYouTube: true,
      embedUrl: `https://www.youtube.com/embed/${videoId}?${params.toString()}`,
    };
  }

  return { isYouTube: false, embedUrl: videoUrl };
};

export const VideoReel: React.FC<VideoReelProps> = ({
  video,
  isActive,
  onNext,
  onPrevious,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { isYouTube, embedUrl } = getVideoEmbedUrl(video.videoUrl);

  // Auto-play when video becomes active
  useEffect(() => {
    if (isActive) {
      if (isYouTube && iframeRef.current) {
        // For YouTube iframes, autoplay is handled by URL parameters in embed URL
        // Reload iframe to trigger autoplay if needed
        const currentSrc = iframeRef.current.src;
        if (!currentSrc.includes("autoplay=1")) {
          iframeRef.current.src = embedUrl;
        }
        setIsPlaying(true);
      } else if (!isYouTube && videoRef.current) {
        videoRef.current.play().catch((error) => {
          console.error("[VideoReel] Error playing video:", error);
          setIsPlaying(false);
        });
        setIsPlaying(true);
      }
    } else {
      if (!isYouTube && videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      // YouTube iframes pause automatically when not visible
      if (isYouTube) {
        setIsPlaying(false);
      }
    }
  }, [isActive, isYouTube, embedUrl]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    // TODO: Implement API call to save like
  };

  const handleComment = () => {
    setShowComments(!showComments);
    // TODO: Implement comment modal/section
  };

  const handleVideoClick = () => {
    if (isYouTube) {
      // YouTube iframes handle play/pause through their own controls
      // Toggle play state for UI feedback
      setIsPlaying(!isPlaying);
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className={styles.reelContainer}>
      <div className={styles.videoWrapper}>
        {isYouTube ? (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className={styles.videoIframe}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={video.title}
            style={{ width: "100%", height: "100%", border: "none" }}
            onLoad={() => {
              console.log("[VideoReel] YouTube iframe loaded:", video.title);
              setIsPlaying(true);
            }}
            onError={(e) => {
              console.error("[VideoReel] YouTube iframe error:", e);
            }}
          />
        ) : (
          <>
            <video
              ref={videoRef}
              src={embedUrl}
              className={styles.video}
              loop
              playsInline
              autoPlay
              muted={true}
              onClick={handleVideoClick}
              onLoadedData={() => {
                console.log("[VideoReel] Video loaded:", video.title);
                if (isActive) {
                  setIsPlaying(true);
                }
              }}
              onError={(e) => {
                console.error("[VideoReel] Video error:", e, video.videoUrl);
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {!isPlaying && (
              <div className={styles.playOverlay} onClick={handleVideoClick}>
                <div className={styles.playIcon}>▶</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Video Info Overlay */}
      <div className={styles.infoOverlay}>
        <div className={styles.videoInfo}>
          <h3 className={styles.title}>{video.title}</h3>
          {video.description && (
            <p className={styles.description}>{video.description}</p>
          )}
        </div>
      </div>

      {/* Action Buttons (Right Side) */}
      <div className={styles.actions}>
        <button
          className={`${styles.actionButton} ${isLiked ? styles.liked : ""}`}
          onClick={handleLike}
          aria-label="Like"
        >
          <Heart size={28} fill={isLiked ? "currentColor" : "none"} />
          <span className={styles.actionCount}>0</span>
        </button>

        <button
          className={styles.actionButton}
          onClick={handleComment}
          aria-label="Comment"
        >
          <MessageCircle size={28} />
          <span className={styles.actionCount}>0</span>
        </button>
      </div>
    </div>
  );
};

