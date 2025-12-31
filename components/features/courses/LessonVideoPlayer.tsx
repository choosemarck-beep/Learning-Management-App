"use client";

import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, HelpCircle, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useVideoWatchTimer } from "@/lib/hooks/useVideoWatchTimer";
import toast from "react-hot-toast";
import styles from "./LessonVideoPlayer.module.css";

interface LessonVideoPlayerProps {
  lessonId: string;
  videoUrl: string | null;
  videoThumbnail?: string | null;
  videoDuration?: number | null;
  minimumWatchTime: number;
  initialWatchedSeconds: number;
  canTakeQuiz: boolean;
  quizTaskId: string | null;
  quizTaskTitle?: string;
  onQuizClick: () => void;
}

export const LessonVideoPlayer: React.FC<LessonVideoPlayerProps> = ({
  lessonId,
  videoUrl,
  videoThumbnail,
  videoDuration,
  minimumWatchTime,
  initialWatchedSeconds,
  canTakeQuiz: initialCanTakeQuiz,
  quizTaskId,
  quizTaskTitle,
  onQuizClick,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    watchedSeconds,
    canTakeQuiz,
    isTracking,
    startTracking,
    stopTracking,
    updateProgress,
  } = useVideoWatchTimer({
    lessonId,
    initialWatchedSeconds,
    minimumWatchTime,
  });

  // Handle video play/pause
  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      stopTracking();
    } else {
      // Resume from saved position if available and video hasn't started yet
      if (videoRef.current.currentTime === 0 && initialWatchedSeconds > 0) {
        const duration = videoRef.current.duration || videoDuration || 0;
        const resumePosition = Math.min(
          initialWatchedSeconds,
          duration * 0.95
        );
        if (resumePosition > 0 && duration > 0) {
          videoRef.current.currentTime = resumePosition;
        }
      }
      videoRef.current.play();
      setIsPlaying(true);
      startTracking();
    }
  };

  // Handle video time update
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  // Handle video ended
  const handleEnded = () => {
    setIsPlaying(false);
    stopTracking();
    updateProgress();
  };

  // Handle video loaded
  const handleLoadedMetadata = () => {
    setIsLoading(false);
    // Don't auto-seek - let user click play to start/resume
  };

  // Sync video state with tracking
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying && !isTracking) {
        startTracking();
      } else if (!isPlaying && isTracking) {
        stopTracking();
      }
    }
  }, [isPlaying, isTracking, startTracking, stopTracking]);

  // Update progress periodically
  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(() => {
        updateProgress();
      }, 10000); // Update every 10 seconds

      return () => clearInterval(interval);
    }
  }, [isTracking, updateProgress]);

  // Handle fullscreen changes
  useEffect(() => {
    const { setupFullscreenListeners } = require("@/lib/utils/fullscreen");
    const cleanup = setupFullscreenListeners((isFs: boolean) => {
      setIsFullscreen(isFs);
    });

    return cleanup;
  }, []);

  // Toggle fullscreen
  const handleFullscreen = async () => {
    try {
      const { toggleFullscreen } = await import("@/lib/utils/fullscreen");
      await toggleFullscreen(videoRef.current, videoContainerRef.current);
    } catch (error) {
      console.error("[LessonVideo] Error toggling fullscreen:", error);
      toast.error("Failed to toggle fullscreen. Please try again.");
    }
  };

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercentage =
    minimumWatchTime > 0
      ? Math.min((watchedSeconds / minimumWatchTime) * 100, 100)
      : 0;

  const remainingSeconds = Math.max(0, minimumWatchTime - watchedSeconds);

  if (!videoUrl) {
    return (
      <div className={styles.container}>
        <div className={styles.noVideo}>
          <p>No video available for this lesson.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div ref={videoContainerRef} className={styles.videoWrapper}>
        <video
          ref={videoRef}
          src={videoUrl}
          poster={videoThumbnail || undefined}
          className={styles.video}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onLoadedMetadata={handleLoadedMetadata}
          playsInline
          controls
        />
        
        {/* Fullscreen Button Overlay */}
        <button
          className={styles.fullscreenButton}
          onClick={handleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>

        {isLoading && (
          <div className={styles.loadingOverlay}>
            <p>Loading video...</p>
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.watchProgress}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Watch Progress</span>
            <span className={styles.progressTime}>
              {formatTime(watchedSeconds)} / {formatTime(minimumWatchTime)}
            </span>
          </div>
          <ProgressBar
            value={progressPercentage}
            className={styles.progressBar}
          />
          {remainingSeconds > 0 && (
            <p className={styles.remainingTime}>
              {formatTime(remainingSeconds)} remaining to unlock quiz
            </p>
          )}
        </div>

        {videoDuration && (
          <div className={styles.videoInfo}>
            <span className={styles.duration}>
              Video Duration: {formatTime(videoDuration)}
            </span>
            {currentTime > 0 && (
              <span className={styles.currentTime}>
                Current: {formatTime(currentTime)}
              </span>
            )}
          </div>
        )}

        <div className={styles.quizSection}>
          <Button
            variant={canTakeQuiz ? "primary" : "outline"}
            className={styles.quizButton}
            disabled={!canTakeQuiz || !quizTaskId}
            onClick={onQuizClick}
          >
            <HelpCircle size={18} />
            {canTakeQuiz
              ? quizTaskTitle || "Take Quiz"
              : `Watch ${formatTime(remainingSeconds)} more to unlock quiz`}
          </Button>
          {!canTakeQuiz && (
            <p className={styles.quizHint}>
              Complete the minimum watch time to take the quiz
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

