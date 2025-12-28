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

  // Auto-play when video becomes active
  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error("Error playing video:", error);
      });
      setIsPlaying(true);
    } else if (!isActive && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    // TODO: Implement API call to save like
  };

  const handleComment = () => {
    setShowComments(!showComments);
    // TODO: Implement comment modal/section
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
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
        <video
          ref={videoRef}
          src={video.videoUrl}
          className={styles.video}
          loop
          playsInline
          muted={false}
          onClick={handleVideoClick}
        />
        {!isPlaying && (
          <div className={styles.playOverlay} onClick={handleVideoClick}>
            <div className={styles.playIcon}>▶</div>
          </div>
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

