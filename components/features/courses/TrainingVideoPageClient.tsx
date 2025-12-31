"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, CheckCircle2, FileQuestion, Award, Lock, ChevronDown, ChevronUp, AlertTriangle, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/Modal";
import toast from "react-hot-toast";
import { getVideoEmbedUrl, getVideoType, isYouTubeUrl } from "@/lib/utils/videoUtils";
import { MiniTrainingModal } from "./MiniTrainingModal";
import styles from "./TrainingVideoPageClient.module.css";

// YouTube Player API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface Training {
  id: string;
  title: string;
  shortDescription: string | null;
  videoUrl: string | null;
  videoDuration: number | null;
  videoThumbnail: string | null;
  minimumWatchTime: number | null;
  totalXP: number;
  order: number;
}

interface Course {
  id: string;
  title: string;
}

interface Quiz {
  id: string;
  title: string;
  passingScore: number;
  timeLimit: number | null;
  allowRetake: boolean;
  maxAttempts: number | null;
  questions: any[];
}

interface MiniTraining {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  videoDuration: number | null;
  order: number;
  isRequired: boolean;
  miniQuiz: {
    id: string;
    title: string;
  } | null;
}

interface TrainingProgress {
  videoProgress: number;
  videoWatchedSeconds: number;
  quizCompleted: boolean;
  quizScore: number | null;
  quizPostponed?: boolean;
  miniTrainingsCompleted: number;
  totalMiniTrainings: number;
  progress: number;
  isCompleted: boolean;
}

interface TrainingVideoPageClientProps {
  trainingId: string;
  initialData: {
    training: Training;
    course: Course;
    quiz: Quiz | null;
    miniTrainings: MiniTraining[];
    progress: TrainingProgress;
  };
}

export const TrainingVideoPageClient: React.FC<TrainingVideoPageClientProps> = ({
  trainingId,
  initialData,
}) => {
  const router = useRouter();
  const [progress, setProgress] = useState(initialData.progress);
  const [canTakeQuiz, setCanTakeQuiz] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [watchedSeconds, setWatchedSeconds] = useState(progress.videoWatchedSeconds);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isYouTubePlayerReady, setIsYouTubePlayerReady] = useState(false);
  const [actualVideoDuration, setActualVideoDuration] = useState<number | null>(null);
  const [hasResumed, setHasResumed] = useState(false); // Track if we've already resumed from saved position
  
  // Overview "See More" state
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // Mini Training Modal state
  const [selectedMiniTrainingId, setSelectedMiniTrainingId] = useState<string | null>(null);
  const [isMiniTrainingModalOpen, setIsMiniTrainingModalOpen] = useState(false);
  
  // Quiz Warning Modal state
  const [isQuizWarningModalOpen, setIsQuizWarningModalOpen] = useState(false);
  
  // YouTube Player API refs
  const youtubePlayerRef = useRef<any>(null);
  const youtubeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveProgressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedSecondsRef = useRef<number>(progress.videoWatchedSeconds);
  
  // Video type detection
  const videoUrl = initialData.training.videoUrl;
  const videoType = videoUrl ? getVideoType(videoUrl) : "unknown";
  const isYouTube = videoUrl ? isYouTubeUrl(videoUrl) : false;
  const embedUrl = videoUrl ? getVideoEmbedUrl(videoUrl) : null;

  // Update video progress on server
  // Saves watch position regardless of quiz status to enable resume functionality
  const updateVideoProgress = async (seconds: number, playing: boolean, immediate: boolean = false) => {
    try {
      // Ensure seconds is a valid integer
      const watchedSeconds = Math.floor(seconds);
      if (isNaN(watchedSeconds) || !isFinite(watchedSeconds) || watchedSeconds < 0) {
        console.error("Invalid watchedSeconds value:", seconds);
        return;
      }

      const response = await fetch(`/api/trainings/${trainingId}/watch-progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          watchedSeconds: watchedSeconds,
          isPlaying: playing,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || "Unknown error" };
        }
        console.error("Error updating video progress:", response.status, errorData);
        // Don't show toast for 500 errors - they're logged and will be retried
        if (response.status !== 500) {
          toast.error(`Failed to save progress: ${errorData.error || "Unknown error"}`);
        }
        return;
      }

      const result = await response.json();
      if (result.success && result.data) {
        // Don't update watchedSeconds from API response - it causes timer to jump back and forth
        // watchedSeconds should only be updated from video's actual current time
        setCanTakeQuiz(result.data.canTakeQuiz || false);
        // Only update overall progress if quiz is completed (for progress calculation)
        // But always save watch position for resume functionality
        if (result.data.progress !== undefined && progress.quizCompleted) {
          setProgress((prev) => ({
            ...prev,
            videoProgress: result.data.videoProgress || prev.videoProgress,
            videoWatchedSeconds: result.data.watchedSeconds || prev.videoWatchedSeconds,
            progress: result.data.progress || prev.progress,
          }));
        } else {
          // Still update videoWatchedSeconds even if quiz not completed
          setProgress((prev) => ({
            ...prev,
            videoWatchedSeconds: result.data.watchedSeconds || prev.videoWatchedSeconds,
          }));
        }
      }
    } catch (error) {
      console.error("Error updating video progress:", error);
      // Only show toast for network errors, not for 500 errors (which are logged server-side)
      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error("Network error: Could not save progress");
      }
    }
  };

  // Debounced save function to prevent excessive API calls
  const debouncedSaveProgress = (seconds: number, playing: boolean, delay: number = 1000) => {
    // Clear existing timeout
    if (saveProgressTimeoutRef.current) {
      clearTimeout(saveProgressTimeoutRef.current);
    }

    // Only save if position changed significantly (more than 1 second difference)
    if (Math.abs(seconds - lastSavedSecondsRef.current) < 1) {
      return;
    }

    saveProgressTimeoutRef.current = setTimeout(() => {
      updateVideoProgress(seconds, playing);
      lastSavedSecondsRef.current = seconds;
    }, delay);
  };

  // Immediate save function for critical events (pause, end, page unload)
  const saveProgressImmediately = (seconds: number, playing: boolean, force: boolean = false) => {
    // Clear any pending debounced saves
    if (saveProgressTimeoutRef.current) {
      clearTimeout(saveProgressTimeoutRef.current);
      saveProgressTimeoutRef.current = null;
    }

    // Always save on pause/end/unload (force=true), or if position changed significantly
    if (force || Math.abs(seconds - lastSavedSecondsRef.current) >= 1) {
      updateVideoProgress(seconds, playing);
      lastSavedSecondsRef.current = seconds;
    }
  };

  // Phase 4: YouTube Player API Integration
  useEffect(() => {
    if (!isYouTube || !embedUrl) {
      setIsYouTubePlayerReady(false);
      return;
    }
    
    // Reset ready state when video changes
    setIsYouTubePlayerReady(false);

    // Suppress YouTube postMessage origin warnings in development
    // This is a known harmless warning when using YouTube IFrame API on localhost
    // The player still works correctly despite this warning
    let originalConsoleError: typeof console.error | null = null;
    
    if (process.env.NODE_ENV === 'development') {
      originalConsoleError = console.error;
      console.error = (...args: any[]) => {
        // Suppress the specific YouTube postMessage origin error
        const message = args[0]?.toString() || '';
        if (
          message.includes('postMessage') &&
          message.includes('youtube.com') &&
          (message.includes('does not match') || message.includes('target origin'))
        ) {
          // Silently ignore this harmless development warning
          return;
        }
        // Call original console.error for all other errors
        if (originalConsoleError) {
          originalConsoleError.apply(console, args);
        }
      };
    }

    // Load YouTube IFrame Player API if not already loaded
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initializeYouTubePlayer();
      };
    } else if (window.YT.Player) {
      initializeYouTubePlayer();
    }

    return () => {
      // Restore original console.error
      if (originalConsoleError && process.env.NODE_ENV === 'development') {
        console.error = originalConsoleError;
      }
      // Reset ready state
      setIsYouTubePlayerReady(false);
      // Cleanup YouTube player interval
      if (youtubeIntervalRef.current) {
        clearInterval(youtubeIntervalRef.current);
        youtubeIntervalRef.current = null;
      }
      // Cleanup YouTube player
      if (youtubePlayerRef.current) {
        try {
          if (typeof youtubePlayerRef.current.destroy === "function") {
            youtubePlayerRef.current.destroy();
          }
        } catch (error) {
          console.error("[YouTube Player] Error destroying player:", error);
        }
        youtubePlayerRef.current = null;
      }
    };
  }, [isYouTube, embedUrl, trainingId]);

  const initializeYouTubePlayer = () => {
    if (!embedUrl || !isYouTube) {
      console.log("[YouTube Player] Initialization skipped: missing embedUrl or not YouTube");
      return;
    }

    const videoId = embedUrl.split("/embed/")[1]?.split("?")[0];
    if (!videoId) {
      console.error("[YouTube Player] Could not extract video ID from embedUrl:", embedUrl);
      return;
    }

    // Check if element exists
    const playerElement = document.getElementById("youtube-player");
    if (!playerElement) {
      console.warn("[YouTube Player] Player element not found, retrying...");
      setTimeout(initializeYouTubePlayer, 100);
      return;
    }

    // Check if YT.Player is available
    if (!window.YT || !window.YT.Player) {
      console.warn("[YouTube Player] YT.Player not available yet, retrying...");
      setTimeout(initializeYouTubePlayer, 100);
      return;
    }

    console.log("[YouTube Player] Initializing player with video ID:", videoId);
    try {
      youtubePlayerRef.current = new window.YT.Player("youtube-player", {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0, // Hide YouTube controls for cleaner look
          disablekb: 1, // Disable keyboard controls
          enablejsapi: 1, // Enable JavaScript API
          rel: 0, // Don't show related videos
          modestbranding: 1, // Minimal YouTube branding
          showinfo: 0, // Hide video info
          iv_load_policy: 3, // Hide annotations
          cc_load_policy: 0, // Hide captions by default
          fs: 0, // Hide fullscreen button
          playsinline: 1, // Play inline on mobile
        },
        events: {
          onReady: (event: any) => {
            console.log("[YouTube Player] Ready - player initialized successfully");
            setIsYouTubePlayerReady(true);
            // Try to get video duration from player if not available
            try {
              const duration = youtubePlayerRef.current?.getDuration();
              if (duration && duration > 0) {
                console.log("[YouTube Player] Got duration from player:", duration);
                setActualVideoDuration(duration);
                // Set saved position when player is ready (but don't auto-play)
                const savedPosition = initialData.progress.videoWatchedSeconds;
                if (savedPosition > 0 && savedPosition < duration * 0.95) {
                  try {
                    console.log("[YouTube Player] Setting saved position on ready:", savedPosition);
                    youtubePlayerRef.current.seekTo(savedPosition, true);
                    setHasResumed(true);
                  } catch (error) {
                    console.error("[YouTube Player] Error seeking to saved position on ready:", error);
                  }
                }
              } else {
                console.log("[YouTube Player] Duration not available yet, will try again on state change");
              }
            } catch (error) {
              console.warn("[YouTube Player] Could not get duration:", error);
            }
            // Don't start tracking on ready - only start when video actually plays
            // Tracking will start in onStateChange when state becomes playing (1)
          },
          onStateChange: (event: any) => {
            // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
            if (event.data === 1) {
              // Playing
              setIsPlaying(true);
              setIsVideoPlaying(true);
              if (youtubePlayerRef.current && typeof youtubePlayerRef.current.getPlayerState === 'function') {
                startYouTubeTracking();
              }
            } else if (event.data === 2) {
              // Paused - save progress immediately
              setIsPlaying(false);
              setIsVideoPlaying(false);
              stopYouTubeTracking();
              // Save progress when paused - always save (force=true) to capture exact position
              try {
                const currentTime = youtubePlayerRef.current?.getCurrentTime?.() || 0;
                if (currentTime > 0) {
                  saveProgressImmediately(Math.floor(currentTime), false, true);
                }
              } catch (error) {
                console.error("[YouTube Player] Error getting current time on pause:", error);
                // Fallback to watchedSeconds if getCurrentTime fails
                if (watchedSeconds > 0) {
                  saveProgressImmediately(watchedSeconds, false, true);
                }
              }
            } else if (event.data === 0) {
              // Ended - show play button overlay
              setIsPlaying(false);
              setIsVideoPlaying(false);
              stopYouTubeTracking();
              const duration = actualVideoDuration || initialData.training.videoDuration || 0;
              setWatchedSeconds(duration);
              // Save final progress - always save (force=true)
              saveProgressImmediately(duration, false, true);
            } else if (event.data === 3) {
              // Buffering - keep tracking if it was playing
              if (isPlaying && youtubePlayerRef.current && typeof youtubePlayerRef.current.getPlayerState === 'function') {
                startYouTubeTracking();
              }
            } else if (event.data === -1) {
              // Unstarted - ensure tracking is stopped
              stopYouTubeTracking();
            }
          },
          onError: (event: any) => {
            console.error("[YouTube Player] Error:", event.data);
            toast.error("An error occurred with the video player.");
          },
        },
      });
    } catch (error) {
      console.error("[YouTube Player] Error initializing:", error);
      setIsYouTubePlayerReady(false);
      toast.error("Failed to initialize video player. Please refresh the page.");
    }
  };

  const startYouTubeTracking = () => {
    // Stop any existing tracking
    if (youtubeIntervalRef.current) {
      clearInterval(youtubeIntervalRef.current);
      youtubeIntervalRef.current = null;
    }

    // Start new tracking interval
    youtubeIntervalRef.current = setInterval(() => {
      if (youtubePlayerRef.current && typeof youtubePlayerRef.current.getPlayerState === 'function') {
        try {
          // Check player state directly instead of relying on isPlaying state
          const playerState = youtubePlayerRef.current.getPlayerState();
          // Player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
          const isCurrentlyPlaying = playerState === 1; // Playing
          
          if (isCurrentlyPlaying && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
            const currentTime = youtubePlayerRef.current.getCurrentTime();
            const seconds = Math.floor(currentTime);
            setWatchedSeconds(seconds);
            // Use debounced save for time updates (saves every 1 second if position changed)
            debouncedSaveProgress(seconds, true, 1000);
          } else if (playerState === 2 || playerState === 0) {
            // Paused or ended - stop tracking
            stopYouTubeTracking();
          }
        } catch (error) {
          console.error("[YouTube Player] Error getting current time:", error);
        }
      }
    }, 1000); // Check every second
  };

  const stopYouTubeTracking = () => {
    if (youtubeIntervalRef.current) {
      clearInterval(youtubeIntervalRef.current);
      youtubeIntervalRef.current = null;
    }
  };

  // Handle page visibility change - pause video when user leaves page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - pause video and stop tracking
        if (isYouTube && youtubePlayerRef.current) {
          try {
            if (typeof youtubePlayerRef.current.pauseVideo === 'function') {
              youtubePlayerRef.current.pauseVideo();
              setIsPlaying(false);
              setIsVideoPlaying(false);
              stopYouTubeTracking();
            }
          } catch (error) {
            console.error("[YouTube Player] Error pausing on visibility change:", error);
          }
        } else if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
          setIsVideoPlaying(false);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isYouTube]);

  // Handle fullscreen changes
  useEffect(() => {
    const { setupFullscreenListeners } = require("@/lib/utils/fullscreen");
    const cleanup = setupFullscreenListeners((isFs: boolean) => {
      setIsFullscreen(isFs);
    });

    return cleanup;
  }, []);

  // Toggle play/pause
  const handlePlayPause = () => {
    if (isYouTube && youtubePlayerRef.current) {
      try {
        if (typeof youtubePlayerRef.current.getPlayerState === 'function') {
          const playerState = youtubePlayerRef.current.getPlayerState();
          // Player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
          if (playerState === 1) {
            // Playing - pause it
            youtubePlayerRef.current.pauseVideo();
            setIsPlaying(false);
            setIsVideoPlaying(false);
            stopYouTubeTracking();
            // Save progress when pausing - always save (force=true) to capture exact position
            try {
              const currentTime = youtubePlayerRef.current.getCurrentTime?.() || 0;
              if (currentTime > 0) {
                saveProgressImmediately(Math.floor(currentTime), false, true);
              }
            } catch (error) {
              console.error("[YouTube Player] Error getting current time on pause:", error);
              // Fallback to watchedSeconds if getCurrentTime fails
              if (watchedSeconds > 0) {
                saveProgressImmediately(watchedSeconds, false, true);
              }
            }
          } else {
            // Paused or unstarted - play it
            // Ensure position is set right before playing (backup in case onReady seek didn't work)
            const savedPosition = initialData.progress.videoWatchedSeconds;
            const duration = actualVideoDuration || initialData.training.videoDuration || 0;
            if (savedPosition > 0 && savedPosition < duration * 0.95 && duration > 0) {
              try {
                // Always seek right before playing to ensure position is correct
                youtubePlayerRef.current.seekTo(savedPosition, true);
                if (!hasResumed) {
                  toast.success(`Resuming from ${formatTime(savedPosition)}`);
                  setHasResumed(true);
                }
              } catch (error) {
                console.error("[YouTube Player] Error seeking to saved position:", error);
              }
            }
            youtubePlayerRef.current.playVideo();
            setIsPlaying(true);
            setIsVideoPlaying(true);
            startYouTubeTracking();
          }
        }
      } catch (error) {
        console.error("[YouTube Player] Error toggling play/pause:", error);
        toast.error("Failed to toggle playback. Please try again.");
      }
    } else if (videoRef.current) {
      if (videoRef.current.paused) {
        // Ensure position is set right before playing (backup in case onLoadedMetadata didn't work)
        const savedPosition = initialData.progress.videoWatchedSeconds;
        const duration = actualVideoDuration || initialData.training.videoDuration || 0;
        if (savedPosition > 0 && savedPosition < duration * 0.95 && duration > 0) {
          // Always set currentTime right before playing to ensure position is correct
          videoRef.current.currentTime = savedPosition;
          if (!hasResumed) {
            toast.success(`Resuming from ${formatTime(savedPosition)}`);
            setHasResumed(true);
          }
        }
        videoRef.current.play().catch((error) => {
          console.error("Error playing video:", error);
          toast.error("Failed to play video. Please try again.");
        });
        setIsPlaying(true);
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        setIsVideoPlaying(false);
        // Save progress when pausing - always save (force=true) to capture exact position
        const currentTime = videoRef.current.currentTime || 0;
        if (currentTime > 0) {
          saveProgressImmediately(Math.floor(currentTime), false, true);
        } else if (watchedSeconds > 0) {
          // Fallback to watchedSeconds if currentTime is 0
          saveProgressImmediately(watchedSeconds, false, true);
        }
      }
    }
  };

  // Toggle fullscreen
  const handleFullscreen = async () => {
    try {
      // For YouTube videos, use container fullscreen (YouTube iframe handles its own fullscreen)
      // For direct videos, try video element first (better mobile support), then container
      if (isYouTube) {
        // YouTube: fullscreen the container (YouTube iframe will handle its own fullscreen button)
        const { toggleFullscreen } = await import("@/lib/utils/fullscreen");
        await toggleFullscreen(null, videoContainerRef.current);
      } else {
        // Direct video: try video element first, then container
        const { toggleFullscreen } = await import("@/lib/utils/fullscreen");
        await toggleFullscreen(videoRef.current, videoContainerRef.current);
      }
    } catch (error) {
      console.error("[TrainingVideo] Error toggling fullscreen:", error);
      toast.error("Failed to toggle fullscreen. Please try again.");
    }
  };

  // Check if quiz can be taken
  useEffect(() => {
    const minimumWatchTime = initialData.training.minimumWatchTime || 0;
    setCanTakeQuiz(watchedSeconds >= minimumWatchTime);
  }, [watchedSeconds, initialData.training.minimumWatchTime]);

  const handleQuizClick = () => {
    if (!canTakeQuiz) {
      toast.error(`Please watch at least ${Math.ceil((initialData.training.minimumWatchTime || 0) / 60)} minutes of the video first.`);
      return;
    }

    if (!initialData.quiz) {
      toast.error("No quiz available for this training.");
      return;
    }

    // Show warning modal instead of navigating directly
    setIsQuizWarningModalOpen(true);
  };

  const handleStartQuiz = async () => {
    setIsQuizWarningModalOpen(false);
    // Clear any "Take it later" choice when starting quiz
    try {
      await fetch(`/api/trainings/${trainingId}/quiz/postpone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postponed: false }),
      });
    } catch (error) {
      console.error("Error clearing postpone status:", error);
    }
    router.push(`/training/${trainingId}/quiz`);
  };

  const handleTakeLater = async () => {
    setIsQuizWarningModalOpen(false);
    try {
      const response = await fetch(`/api/trainings/${trainingId}/quiz/postpone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postponed: true }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("You can take the quiz later. We'll remember your choice.");
      } else {
        toast.error(data.error || "Failed to save your choice");
      }
    } catch (error) {
      console.error("Error saving postpone choice:", error);
      toast.error("Failed to save your choice. Please try again.");
    }
  };

  const handleMiniTrainingClick = (miniTrainingId: string, order: number) => {
    // Check if previous mini trainings are completed
    // miniTrainingsCompleted is the count of completed mini trainings
    // If order 0, 1, 2 are completed, miniTrainingsCompleted = 3
    // So a mini training with order N is completed if N < miniTrainingsCompleted
    const previousMiniTrainings = initialData.miniTrainings.filter(mt => mt.order < order);
    const allPreviousCompleted = previousMiniTrainings.every(mt => {
      // A mini training is completed if its order is less than miniTrainingsCompleted
      return mt.order < progress.miniTrainingsCompleted;
    });

    if (!allPreviousCompleted && previousMiniTrainings.length > 0) {
      // Find the first incomplete mini training
      const firstIncomplete = previousMiniTrainings.find(mt => mt.order >= progress.miniTrainingsCompleted);
      if (firstIncomplete) {
        toast.error(`Please complete "${firstIncomplete.title}" first before accessing this update.`);
        return;
      }
    }

    // Open modal instead of navigating
    setSelectedMiniTrainingId(miniTrainingId);
    setIsMiniTrainingModalOpen(true);
  };

  const handleMiniTrainingComplete = () => {
    // Refresh progress after completion
    // This will trigger a re-render with updated progress
    window.location.reload(); // Simple approach - could be optimized with state management
  };

  // Check if description needs "See More" (more than 4 lines)
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [showSeeMore, setShowSeeMore] = useState(false);
  
  useEffect(() => {
    if (descriptionRef.current && initialData.training.shortDescription) {
      const lineHeight = parseFloat(getComputedStyle(descriptionRef.current).lineHeight);
      const height = descriptionRef.current.scrollHeight;
      const maxHeight = lineHeight * 4; // 4 lines
      setShowSeeMore(height > maxHeight);
    }
  }, [initialData.training.shortDescription]);

  // Auto-save progress on page visibility change (tab switch, minimize, etc.)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User switched tabs or minimized window - save progress (force=true)
        let currentSeconds = watchedSeconds;
        try {
          if (isYouTube && youtubePlayerRef.current && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
            currentSeconds = youtubePlayerRef.current.getCurrentTime() || watchedSeconds;
          } else if (videoRef.current) {
            currentSeconds = videoRef.current.currentTime || watchedSeconds;
          }
        } catch (error) {
          console.warn("Error getting current time for visibility save:", error);
          // Use watchedSeconds as fallback
        }
        if (currentSeconds > 0) {
          saveProgressImmediately(Math.floor(currentSeconds), false, true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isYouTube, watchedSeconds]);

  // Auto-save progress on page unload (navigation away, tab close)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save progress immediately before page unloads using fetch with keepalive
      let currentSeconds = watchedSeconds;
      try {
        if (isYouTube && youtubePlayerRef.current && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
          currentSeconds = youtubePlayerRef.current.getCurrentTime() || watchedSeconds;
        } else if (videoRef.current) {
          currentSeconds = videoRef.current.currentTime || watchedSeconds;
        }
      } catch (error) {
        console.warn("Error getting current time for unload save:", error);
        // Use watchedSeconds as fallback
      }
      
      // Use fetch with keepalive for reliable save on page unload
      // This is more reliable than sendBeacon for Next.js API routes
      fetch(`/api/trainings/${trainingId}/watch-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          watchedSeconds: Math.floor(currentSeconds),
          isPlaying: false,
        }),
        keepalive: true, // Ensures request completes even if page unloads
      }).catch((error) => {
        // Silently fail - we can't do anything about it during unload
        console.error("Failed to save progress on unload:", error);
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [trainingId, isYouTube, watchedSeconds]);

  // Auto-save progress on component unmount (navigation within app)
  useEffect(() => {
    return () => {
      // Component is unmounting - save progress immediately
      let currentSeconds = watchedSeconds;
      try {
        if (isYouTube && youtubePlayerRef.current && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
          currentSeconds = youtubePlayerRef.current.getCurrentTime() || watchedSeconds;
        } else if (videoRef.current) {
          currentSeconds = videoRef.current.currentTime || watchedSeconds;
        }
      } catch (error) {
        console.warn("Error getting current time for unmount save:", error);
        // Use watchedSeconds as fallback
      }
      saveProgressImmediately(Math.floor(currentSeconds), false);
      
      // Clear any pending timeouts
      if (saveProgressTimeoutRef.current) {
        clearTimeout(saveProgressTimeoutRef.current);
      }
    };
  }, [trainingId, isYouTube, watchedSeconds]);

  // Use actual duration from video element/player if available, otherwise fall back to initialData
  const videoDuration = actualVideoDuration || initialData.training.videoDuration || 0;
  const videoProgressPercent = videoDuration > 0 ? (watchedSeconds / videoDuration) * 100 : 0;
  const minimumWatchTime = initialData.training.minimumWatchTime || 0;
  const quizUnlockPercent = videoDuration > 0 ? (minimumWatchTime / videoDuration) * 100 : 0;
  const isQuizUnlocked = watchedSeconds >= minimumWatchTime;

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className={styles.container}>
      {videoUrl && embedUrl ? (
        <div className={styles.videoSection}>

          <div 
            ref={videoContainerRef}
            className={styles.videoContainer}
            onMouseEnter={() => {
              setShowControls(true);
              if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
              }
            }}
            onMouseLeave={() => {
              if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
              }
              controlsTimeoutRef.current = setTimeout(() => {
                if (isVideoPlaying) {
                  setShowControls(false);
                }
              }, 2000);
            }}
            onTouchStart={() => {
              setShowControls(true);
              if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
              }
              controlsTimeoutRef.current = setTimeout(() => {
                if (isVideoPlaying) {
                  setShowControls(false);
                }
              }, 3000);
            }}
          >
            {isYouTube ? (
              <>
                <div id="youtube-player" className={styles.youtubePlayer} />
                {/* Overlay to prevent clicks on YouTube title/logo - always present when not playing */}
                {!isVideoPlaying && !isYouTubePlayerReady && (
                  <div 
                    className={styles.youtubeOverlay}
                    style={{ cursor: 'wait' }}
                  >
                    <div style={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: '50%', 
                      transform: 'translate(-50%, -50%)',
                      color: 'white',
                      fontSize: '14px'
                    }}>
                      Loading player...
                    </div>
                  </div>
                )}
                {!isVideoPlaying && isYouTubePlayerReady && (
                  <div 
                    className={styles.youtubeOverlay}
                    onClick={async () => {
                      console.log("[YouTube Player] Overlay clicked - attempting to play");
                      // Player is ready, try to play
                      if (!youtubePlayerRef.current) {
                        console.error("[YouTube Player] Player ref is null");
                        toast.error("Video player is not ready. Please wait a moment and try again.");
                        return;
                      }

                      // Check if player methods are available
                      if (typeof youtubePlayerRef.current.playVideo !== 'function') {
                        console.error("[YouTube Player] playVideo method not available");
                        toast.error("Video player is not ready. Please wait a moment and try again.");
                        return;
                      }

                      // Check player state to ensure it's ready
                      try {
                        const playerState = youtubePlayerRef.current.getPlayerState();
                        console.log("[YouTube Player] Current player state:", playerState);
                        // Player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
                        // If state is -1 (unstarted) or 5 (cued), player is ready
                        if (playerState === -1 || playerState === 5 || playerState === 2) {
                          // Ensure position is set right before playing (backup in case onReady seek didn't work)
                          const savedPosition = initialData.progress.videoWatchedSeconds;
                          const duration = actualVideoDuration || initialData.training.videoDuration || 0;
                          if (savedPosition > 0 && savedPosition < duration * 0.95 && duration > 0) {
                            try {
                              // Always seek right before playing to ensure position is correct
                              youtubePlayerRef.current.seekTo(savedPosition, true);
                              if (!hasResumed) {
                                toast.success(`Resuming from ${formatTime(savedPosition)}`);
                                setHasResumed(true);
                              }
                            } catch (error) {
                              console.error("[YouTube Player] Error seeking to saved position:", error);
                            }
                          }
                          console.log("[YouTube Player] Playing video...");
                          youtubePlayerRef.current.playVideo();
                          setIsVideoPlaying(true);
                          setIsPlaying(true);
                          startYouTubeTracking();
                        } else if (playerState === 1) {
                          // Already playing
                          console.log("[YouTube Player] Video already playing");
                          setIsVideoPlaying(true);
                          setIsPlaying(true);
                        } else {
                          // Try to play anyway
                          console.log("[YouTube Player] Attempting to play despite state:", playerState);
                          youtubePlayerRef.current.playVideo();
                          setIsVideoPlaying(true);
                          setIsPlaying(true);
                          startYouTubeTracking();
                        }
                      } catch (error) {
                        console.error("[YouTube Player] Error playing video:", error);
                        toast.error("Failed to play video. Please try again.");
                      }
                    }}
                    style={{ cursor: 'pointer', opacity: 0.3 }}
                  />
                )}
                {/* Permanent overlay to block clicks on YouTube UI elements when playing */}
                {isVideoPlaying && (
                  <div className={styles.youtubeClickBlocker} />
                )}
                {/* Video Controls Overlay */}
                <div className={`${styles.videoControlsOverlay} ${showControls || !isVideoPlaying ? styles.visible : ""}`}>
                  <button
                    className={styles.controlButton}
                    onClick={handlePlayPause}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause size={12} /> : <Play size={12} fill="currentColor" />}
                  </button>
                  <button
                    className={styles.controlButton}
                    onClick={handleFullscreen}
                    aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  >
                    {isFullscreen ? <Minimize size={12} /> : <Maximize size={12} />}
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.videoPlayer}>
                {initialData.training.videoThumbnail && !isVideoPlaying ? (
                  <div 
                    className={styles.videoThumbnail}
                    onClick={() => {
                      console.log("[Direct Video] Thumbnail clicked - starting playback");
                      // Ensure position is set right before playing (backup in case onLoadedMetadata didn't work)
                      if (videoRef.current) {
                        const savedPosition = initialData.progress.videoWatchedSeconds;
                        const duration = actualVideoDuration || initialData.training.videoDuration || 0;
                        if (savedPosition > 0 && savedPosition < duration * 0.95 && duration > 0) {
                          // Always set currentTime right before playing to ensure position is correct
                          videoRef.current.currentTime = savedPosition;
                          if (!hasResumed) {
                            toast.success(`Resuming from ${formatTime(savedPosition)}`);
                            setHasResumed(true);
                          }
                        }
                      }
                      setIsVideoPlaying(true);
                      setIsPlaying(true);
                      // Small delay to ensure state is updated before playing
                      setTimeout(() => {
                        if (videoRef.current) {
                          videoRef.current.play().catch((error) => {
                            console.error("[Direct Video] Error playing video:", error);
                            toast.error("Failed to play video. Please try again.");
                            setIsVideoPlaying(false);
                            setIsPlaying(false);
                          });
                        }
                      }, 100);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      src={initialData.training.videoThumbnail}
                      alt={initialData.training.title}
                      className={styles.thumbnailImage}
                    />
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      src={embedUrl}
                      className={styles.video}
                      onLoadedMetadata={(e) => {
                        const video = e.currentTarget;
                        const duration = video.duration;
                        console.log("[Direct Video] Metadata loaded, duration:", duration);
                        if (duration && duration > 0 && isFinite(duration)) {
                          setActualVideoDuration(duration);
                          // Set saved position when metadata loads (but don't auto-play)
                          const savedPosition = initialData.progress.videoWatchedSeconds;
                          if (savedPosition > 0 && savedPosition < duration * 0.95 && isFinite(savedPosition)) {
                            console.log("[Direct Video] Setting saved position:", savedPosition);
                            video.currentTime = savedPosition;
                            setHasResumed(true);
                          }
                        }
                      }}
                      onPlay={() => {
                        console.log("[Direct Video] Video started playing");
                        setIsVideoPlaying(true);
                        setIsPlaying(true);
                      }}
                      onPause={() => {
                        console.log("[Direct Video] Video paused");
                        setIsVideoPlaying(false);
                        setIsPlaying(false);
                        // Save progress immediately when paused - always save (force=true) to capture exact position
                        const currentTime = videoRef.current?.currentTime || 0;
                        if (currentTime > 0) {
                          saveProgressImmediately(Math.floor(currentTime), false, true);
                        } else if (watchedSeconds > 0) {
                          // Fallback to watchedSeconds if currentTime is 0
                          saveProgressImmediately(watchedSeconds, false, true);
                        }
                      }}
                      onTimeUpdate={(e) => {
                        const video = e.currentTarget;
                        const seconds = Math.floor(video.currentTime);
                        setWatchedSeconds(seconds);
                        // Use debounced save for time updates (saves every 1 second if position changed)
                        debouncedSaveProgress(seconds, !video.paused, 1000);
                      }}
                      onEnded={() => {
                        console.log("[Direct Video] Video ended");
                        const finalDuration = videoRef.current?.duration || videoDuration;
                        setWatchedSeconds(finalDuration);
                        // Save final progress immediately - always save (force=true)
                        saveProgressImmediately(finalDuration, false, true);
                      }}
                      onError={(e) => {
                        console.error("[Direct Video] Video error:", e);
                        toast.error("An error occurred while loading the video.");
                      }}
                    />
                    {/* Video Controls Overlay */}
                    <div className={`${styles.videoControlsOverlay} ${showControls || !isVideoPlaying ? styles.visible : ""}`}>
                      <button
                        className={styles.controlButton}
                        onClick={handlePlayPause}
                        aria-label={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? <Pause size={12} /> : <Play size={12} fill="currentColor" />}
                      </button>
                      <button
                        className={styles.controlButton}
                        onClick={handleFullscreen}
                        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                      >
                        {isFullscreen ? <Minimize size={12} /> : <Maximize size={12} />}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Phase 3: Progress Timer - Positioned as part of video (no quiz indicator) */}
            {(videoDuration > 0 || watchedSeconds > 0) && (
              <div className={styles.progressTimerOverlay}>
                <div className={styles.progressTimerHeader}>
                  <span className={styles.timerLabel}>
                    {formatTime(watchedSeconds)} {videoDuration > 0 ? `/ ${formatTime(videoDuration)}` : '(Loading duration...)'}
                  </span>
                </div>
                {videoDuration > 0 && (
                  <div className={styles.progressTimerBar}>
                    <div
                      className={styles.progressTimerFill}
                      style={{ width: `${videoProgressPercent}%` }}
                    />
                    {minimumWatchTime > 0 && quizUnlockPercent < 100 && (
                      <div
                        className={`${styles.quizUnlockMarker} ${isQuizUnlocked ? styles.unlocked : ""}`}
                        style={{ left: `${quizUnlockPercent}%` }}
                        title={`Quiz unlocks at ${formatTime(minimumWatchTime)}`}
                      >
                        <div className={styles.markerDot} />
                        <div className={styles.markerLine} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quiz Button - Right below video, very close */}
          {initialData.quiz && (
            <div className={styles.quizButtonSection}>
              <Button
                variant={progress.quizCompleted ? "secondary" : isQuizUnlocked ? "primary" : "outline"}
                onClick={handleQuizClick}
                disabled={!isQuizUnlocked && !progress.quizCompleted}
                className={`${styles.quizButton} ${isQuizUnlocked && !progress.quizCompleted ? styles.quizUnlocked : ""}`}
              >
                {progress.quizCompleted ? "Retake Quiz" : isQuizUnlocked ? "Take Quiz" : "Quiz Locked"}
              </Button>
              {!isQuizUnlocked && !progress.quizCompleted && (
                <p className={styles.quizHint}>
                  Watch {formatTime(minimumWatchTime)} ({Math.ceil(minimumWatchTime / 60)} min) to unlock the quiz
                </p>
              )}
              {isQuizUnlocked && !progress.quizCompleted && progress.quizPostponed && (
                <p className={styles.quizPostponedHint}>
                  You previously chose to take the quiz later. Ready to take it now?
                </p>
              )}
            </div>
          )}

          {/* Overview Section - Below Quiz Button */}
          <div className={styles.overviewSection}>
            {initialData.training.shortDescription && (
              <div className={styles.descriptionContainer}>
                <p
                  ref={descriptionRef}
                  className={`${styles.description} ${!isDescriptionExpanded ? styles.descriptionCollapsed : ""}`}
                >
                  {initialData.training.shortDescription}
                </p>
                {showSeeMore && (
                  <button
                    className={styles.seeMoreButton}
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    aria-label={isDescriptionExpanded ? "See less" : "See more"}
                  >
                    {isDescriptionExpanded ? (
                      <>
                        See Less <ChevronUp size={16} />
                      </>
                    ) : (
                      <>
                        See More <ChevronDown size={16} />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
            <div className={styles.metadata}>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Duration:</span>
                <span className={styles.metadataValue}>{formatTime(videoDuration)}</span>
              </div>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Progress:</span>
                <span className={styles.metadataValue}>{Math.round(progress.progress)}%</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Phase 3: Content Section */}
      <div className={styles.content}>
        {/* Quiz Details Card (if quiz completed) */}
        {initialData.quiz && progress.quizCompleted && (
          <Card className={styles.quizCard}>
            <CardBody>
              <div className={styles.quizHeader}>
                <FileQuestion size={20} />
                <h3 className={styles.quizTitle}>{initialData.quiz.title}</h3>
              </div>
              {progress.quizScore !== null && (
                <div className={styles.quizScore}>
                  <span>Score: {progress.quizScore}%</span>
                  {progress.quizScore >= initialData.quiz.passingScore ? (
                    <span className={styles.passed}>Passed</span>
                  ) : (
                    <span className={styles.failed}>Failed</span>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Updates Section - Feed Format */}
        {initialData.miniTrainings.length > 0 && (
          <div className={styles.updatesSection}>
            <h2 className={styles.sectionTitle}>Updates</h2>
            <div className={styles.updatesFeed}>
              {/* Sort by order descending (most recent first) */}
              {[...initialData.miniTrainings]
                .sort((a, b) => b.order - a.order) // Most recent first (highest order number)
                .map((mt) => {
                  // A mini training is completed if its order is less than miniTrainingsCompleted
                  // e.g., if miniTrainingsCompleted = 3, then orders 0, 1, 2 are completed
                  const isCompleted = mt.order < progress.miniTrainingsCompleted;
                  
                  // Check if previous updates (lower order numbers) are completed
                  const previousUpdates = initialData.miniTrainings.filter(
                    other => other.order < mt.order
                  );
                  const allPreviousCompleted = previousUpdates.every(
                    other => other.order < progress.miniTrainingsCompleted
                  );
                  const isLocked = !allPreviousCompleted && previousUpdates.length > 0;

                  return (
                    <Card
                      key={mt.id}
                      className={`${styles.updateCard} ${isLocked ? styles.updateLocked : ""} ${isCompleted ? styles.updateCompleted : ""}`}
                      onClick={() => !isLocked && handleMiniTrainingClick(mt.id, mt.order)}
                    >
                      <CardBody>
                        <div className={styles.updateHeader}>
                          <div className={styles.updateHeaderLeft}>
                            {isLocked ? (
                              <Lock size={18} className={styles.lockIcon} />
                            ) : isCompleted ? (
                              <CheckCircle2 size={18} className={styles.completedIcon} />
                            ) : null}
                            <h4 className={styles.updateTitle}>{mt.title}</h4>
                          </div>
                          {/* XP Display - Aligned with title */}
                          <div className={styles.updateXP}>
                            <Award size={14} className={styles.xpIcon} />
                            <span className={styles.xpValue}>
                              {Math.round(initialData.training.totalXP / Math.max(initialData.miniTrainings.length, 1))} XP
                            </span>
                          </div>
                        </div>
                        {mt.description && (
                          <p className={styles.updateDescription}>{mt.description}</p>
                        )}
                        {isLocked && (
                          <div className={styles.lockedMessage}>
                            <Lock size={14} />
                            <span>Complete previous updates to unlock</span>
                          </div>
                        )}
                        {isCompleted && !isLocked && (
                          <div className={styles.completedBadge}>
                            <CheckCircle2 size={14} />
                            <span>Completed</span>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Mini Training Modal */}
      {selectedMiniTrainingId && (
        <MiniTrainingModal
          isOpen={isMiniTrainingModalOpen}
          onClose={() => {
            setIsMiniTrainingModalOpen(false);
            setSelectedMiniTrainingId(null);
          }}
          miniTrainingId={selectedMiniTrainingId}
          trainingId={trainingId}
          onComplete={handleMiniTrainingComplete}
        />
      )}

      {/* Quiz Warning Modal */}
      <Modal
        isOpen={isQuizWarningModalOpen}
        onClose={() => setIsQuizWarningModalOpen(false)}
        title="Quiz Warning"
        showCloseButton={true}
        closeOnBackdropClick={true}
      >
        <div className={styles.quizWarningModalContent}>
          <div className={styles.quizWarningHeader}>
            <AlertTriangle 
              size={24} 
              className={styles.quizWarningIcon}
            />
            <div className={styles.quizWarningText}>
              <p className={styles.quizWarningIntro}>
                Before you begin, please note the following important information:
              </p>
              <ul className={styles.quizWarningList}>
                <li>You <strong>cannot close</strong> the quiz once you start</li>
                <li>You need to give your <strong>full attention</strong> when taking the quiz</li>
                <li>You can only take this quiz <strong>3 times maximum</strong></li>
                <li>Your <strong>highest score</strong> will be recorded</li>
              </ul>
            </div>
          </div>
          <div className={styles.quizWarningActions}>
            <Button
              variant="primary"
              onClick={handleStartQuiz}
              className={styles.quizWarningButton}
            >
              Yes, I'm Ready
            </Button>
            <Button
              variant="outline"
              onClick={handleTakeLater}
              className={styles.quizWarningButton}
            >
              Take it Later
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

