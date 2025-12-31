"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Play, Lock, CheckCircle2, FileQuestion, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import toast from "react-hot-toast";
import { getVideoEmbedUrl, getVideoType, isYouTubeUrl, extractYouTubeVideoId } from "@/lib/utils/videoUtils";
import { MiniQuizModal } from "./MiniQuizModal";
import { AnimatedProgressBar } from "@/components/ui";
import styles from "./MiniTrainingModal.module.css";

interface MiniTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  miniTrainingId: string;
  trainingId: string;
  onComplete?: () => void;
}

interface MiniTrainingData {
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
    passingScore: number;
    questions: any[] | string; // Can be string (JSON) or parsed array
  } | null;
}

interface ProgressData {
  videoProgress: number;
  quizCompleted: boolean;
  isCompleted: boolean;
}

export const MiniTrainingModal: React.FC<MiniTrainingModalProps> = ({
  isOpen,
  onClose,
  miniTrainingId,
  trainingId,
  onComplete,
}) => {
  const [miniTraining, setMiniTraining] = useState<MiniTrainingData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true when modal opens
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canTakeQuiz, setCanTakeQuiz] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

  // YouTube Player API refs
  const youtubePlayerRef = useRef<any>(null);
  const youtubeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasResumed, setHasResumed] = useState(false);
  const [actualVideoDuration, setActualVideoDuration] = useState<number | null>(null);
  const saveProgressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedSecondsRef = useRef<number>(0);

  // Video type detection
  const videoUrl = miniTraining?.videoUrl;
  const videoType = videoUrl ? getVideoType(videoUrl) : "unknown";
  const isYouTube = videoUrl ? isYouTubeUrl(videoUrl) : false;
  const embedUrl = videoUrl ? getVideoEmbedUrl(videoUrl) : null;

  // Fetch mini training data
  useEffect(() => {
    if (isOpen && miniTrainingId) {
      setIsLoading(true); // Ensure loading state is set when modal opens
      fetchMiniTraining();
    }
  }, [isOpen, miniTrainingId]);

  // Reset state when modal closes (separate effect to avoid render-time updates)
  useEffect(() => {
    if (!isOpen) {
      // Use setTimeout to defer state updates until after render
      const timer = setTimeout(() => {
        setMiniTraining(null);
        setProgress(null);
        setWatchedSeconds(0);
        setIsVideoPlaying(false);
        setIsPlaying(false);
        setCanTakeQuiz(false);
        setIsQuizModalOpen(false);
        setIsLoading(false); // Reset loading state when modal closes
      }, 0);
      return () => clearTimeout(timer);
    } else {
      // When modal opens, set loading to true immediately
      setIsLoading(true);
    }
  }, [isOpen]);

  const fetchMiniTraining = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/mini-trainings/${miniTrainingId}`);
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to load mini training");
        // Use setTimeout to avoid calling onClose during render
        setTimeout(() => {
          onClose();
        }, 0);
        return;
      }

      const miniTrainingData = result.data.miniTraining;
      // Parse quiz questions if they exist
      if (miniTrainingData.miniQuiz && typeof miniTrainingData.miniQuiz.questions === 'string') {
        try {
          const parsedQuestions = JSON.parse(miniTrainingData.miniQuiz.questions || "[]");
          // Normalize question options: convert string arrays to object arrays
          miniTrainingData.miniQuiz.questions = parsedQuestions.map((question: any) => {
            if (question.options && Array.isArray(question.options)) {
              // Check if options are strings (from trainer form) or objects
              const normalizedOptions = question.options.map((option: any, index: number) => {
                if (typeof option === 'string') {
                  // Convert string to object format
                  return {
                    id: `opt-${question.id || `q-${index}`}-${index}`,
                    text: option,
                  };
                } else {
                  // Already an object, ensure it has id and text
                  return {
                    id: option.id || `opt-${question.id || `q-${index}`}-${index}`,
                    text: option.text || option.label || String(option),
                  };
                }
              });
              return {
                ...question,
                options: normalizedOptions,
              };
            }
            return question;
          });
        } catch (error) {
          console.error("Error parsing mini quiz questions:", error);
          miniTrainingData.miniQuiz.questions = [];
        }
      }
      setMiniTraining(miniTrainingData);
      setProgress(result.data.progress);
      // Initialize watched seconds from progress if available
      // Note: We track watched seconds locally, but progress is only saved if quiz passed
      const initialWatchedSeconds = result.data.progress?.videoProgress 
        ? Math.floor((result.data.progress.videoProgress / 100) * (miniTrainingData.videoDuration || 0))
        : 0;
      setWatchedSeconds(initialWatchedSeconds);
      lastSavedSecondsRef.current = initialWatchedSeconds;
      setHasResumed(false); // Reset resume flag when fetching new data
    } catch (error) {
      console.error("Error fetching mini training:", error);
      toast.error("Failed to load mini training");
      // Use setTimeout to avoid calling onClose during render
      setTimeout(() => {
        onClose();
      }, 0);
    } finally {
      setIsLoading(false);
    }
  };

  // YouTube Player API initialization
  useEffect(() => {
    if (isOpen && isYouTube && embedUrl && miniTraining) {
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

      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        // Load YouTube IFrame API if not already loaded
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
        } else {
          // Wait for API to be ready
          const checkReady = setInterval(() => {
            if (window.YT && window.YT.Player) {
              clearInterval(checkReady);
              initializeYouTubePlayer();
            }
          }, 100);
          setTimeout(() => clearInterval(checkReady), 5000); // Timeout after 5 seconds
        }
      }, 100);

      return () => {
        // Restore original console.error
        if (originalConsoleError && process.env.NODE_ENV === 'development') {
          console.error = originalConsoleError;
        }
        clearTimeout(timer);
        // Cleanup YouTube player
        if (youtubePlayerRef.current) {
          try {
            if (typeof youtubePlayerRef.current.destroy === "function") {
              youtubePlayerRef.current.destroy();
            }
          } catch (error) {
            console.error("Error destroying YouTube player:", error);
          }
          youtubePlayerRef.current = null;
        }
        if (youtubeIntervalRef.current) {
          clearInterval(youtubeIntervalRef.current);
          youtubeIntervalRef.current = null;
        }
      };
    }
  }, [isOpen, isYouTube, embedUrl, miniTraining]);

  const initializeYouTubePlayer = () => {
    if (!window.YT || !window.YT.Player) {
      setTimeout(initializeYouTubePlayer, 100);
      return;
    }

    const playerElement = document.getElementById("mini-training-youtube-player");
    if (!playerElement) {
      setTimeout(initializeYouTubePlayer, 100);
      return;
    }

    try {
      // Extract video ID from original video URL (not embed URL)
      const videoId = videoUrl ? extractYouTubeVideoId(videoUrl) : null;
      
      if (!videoId) {
        console.error("[Mini Training YouTube] Could not extract video ID from:", videoUrl);
        toast.error("Invalid video URL");
        return;
      }

      youtubePlayerRef.current = new window.YT.Player("mini-training-youtube-player", {
        videoId: videoId,
        playerVars: {
          controls: 0,
          modestbranding: 1,
          showinfo: 0,
          iv_load_policy: 3,
          cc_load_policy: 0,
          fs: 0,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            console.log("[Mini Training YouTube] Player ready");
            // Try to get video duration from player if not available
            try {
              const duration = youtubePlayerRef.current?.getDuration();
              if (duration && duration > 0) {
                console.log("[Mini Training YouTube] Got duration from player:", duration);
                setActualVideoDuration(duration);
                // Set saved position when player is ready (but don't auto-play)
                const savedPosition = progress?.videoProgress 
                  ? Math.floor((progress.videoProgress / 100) * duration)
                  : 0;
                if (savedPosition > 0 && savedPosition < duration * 0.95) {
                  try {
                    console.log("[Mini Training YouTube] Setting saved position on ready:", savedPosition);
                    youtubePlayerRef.current.seekTo(savedPosition, true);
                    setHasResumed(true);
                  } catch (error) {
                    console.error("[Mini Training YouTube] Error seeking to saved position on ready:", error);
                  }
                }
              } else {
                console.log("[Mini Training YouTube] Duration not available yet, will try again on state change");
              }
            } catch (error) {
              console.warn("[Mini Training YouTube] Could not get duration:", error);
            }
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
                console.error("[Mini Training YouTube] Error getting current time on pause:", error);
                // Fallback to watchedSeconds if getCurrentTime fails
                if (watchedSeconds > 0) {
                  saveProgressImmediately(watchedSeconds, false, true);
                }
              }
            } else if (event.data === 0) {
              // Ended - save final progress
              setIsPlaying(false);
              setIsVideoPlaying(false);
              stopYouTubeTracking();
              const duration = actualVideoDuration || miniTraining?.videoDuration || 0;
              setWatchedSeconds(duration);
              // Save final progress - always save (force=true)
              saveProgressImmediately(duration, false, true);
            } else if (event.data === 3) {
              // Buffering - keep tracking if it was playing
              if (isPlaying && youtubePlayerRef.current && typeof youtubePlayerRef.current.getPlayerState === 'function') {
                startYouTubeTracking();
              }
            }
          },
          onError: (event: any) => {
            console.error("[Mini Training YouTube] Player error:", event.data);
            toast.error("Failed to load video. Please try again.");
          },
        },
      });
    } catch (error) {
      console.error("[Mini Training YouTube] Error initializing player:", error);
      toast.error("Failed to initialize video player.");
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
      if (
        youtubePlayerRef.current &&
        typeof youtubePlayerRef.current.getPlayerState === "function" &&
        typeof youtubePlayerRef.current.getCurrentTime === "function"
      ) {
        try {
          // Check player state directly
          const playerState = youtubePlayerRef.current.getPlayerState();
          const isCurrentlyPlaying = playerState === 1; // Playing
          
          if (isCurrentlyPlaying) {
            const currentTime = youtubePlayerRef.current.getCurrentTime();
            const seconds = Math.floor(currentTime);
            setWatchedSeconds(seconds);
            // Use debounced save for time updates (saves every 1 second if position changed)
            debouncedSaveProgress(seconds, true, 1000);
          }
        } catch (error) {
          console.error("[Mini Training YouTube] Error tracking:", error);
        }
      }
    }, 1000);
  };

  const stopYouTubeTracking = () => {
    if (youtubeIntervalRef.current) {
      clearInterval(youtubeIntervalRef.current);
      youtubeIntervalRef.current = null;
    }
  };

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

      const response = await fetch(`/api/mini-trainings/${miniTrainingId}/watch-progress`, {
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
        if (result.data.progress !== undefined && progress?.quizCompleted) {
          setProgress((prev) => (prev ? { 
            ...prev, 
            videoProgress: result.data.videoProgress || prev.videoProgress,
            videoWatchedSeconds: result.data.watchedSeconds || prev.videoProgress 
          } : null));
        } else {
          // Still update videoWatchedSeconds even if quiz not completed
          // This is stored in progress for resume functionality
        }
      }
    } catch (error) {
      console.error("Error updating video progress:", error);
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

  // Check if quiz can be taken (based on minimum watch time)
  useEffect(() => {
    if (!miniTraining?.videoDuration) {
      setCanTakeQuiz(false);
      return;
    }
    // Use 50% of video duration as default minimum watch time for mini trainings
    const minimumWatchTime = Math.floor((miniTraining.videoDuration || 0) * 0.5);
    setCanTakeQuiz(watchedSeconds >= minimumWatchTime);
  }, [watchedSeconds, miniTraining?.videoDuration]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // Toggle fullscreen
  const handleFullscreen = async () => {
    if (!videoContainerRef.current) return;

    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (videoContainerRef.current.requestFullscreen) {
          await videoContainerRef.current.requestFullscreen();
        } else if ((videoContainerRef.current as any).webkitRequestFullscreen) {
          await (videoContainerRef.current as any).webkitRequestFullscreen();
        } else if ((videoContainerRef.current as any).mozRequestFullScreen) {
          await (videoContainerRef.current as any).mozRequestFullScreen();
        } else if ((videoContainerRef.current as any).msRequestFullscreen) {
          await (videoContainerRef.current as any).msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
      toast.error("Failed to toggle fullscreen. Please try again.");
    }
  };

  const handleClose = () => {
    // Stop any tracking
    stopYouTubeTracking();
    setIsVideoPlaying(false);
    setIsPlaying(false);
    // Save progress before closing
    if (watchedSeconds > 0) {
      saveProgressImmediately(watchedSeconds, false, true);
    }
    onClose();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const videoDuration = miniTraining?.videoDuration || 0;
  const videoProgressPercent = videoDuration > 0 ? (watchedSeconds / videoDuration) * 100 : 0;
  // Use 50% of video duration as default minimum watch time for mini trainings
  const minimumWatchTime = videoDuration > 0 ? Math.floor(videoDuration * 0.5) : 0;
  const quizUnlockPercent = videoDuration > 0 ? (minimumWatchTime / videoDuration) * 100 : 0;
  const isQuizUnlocked = watchedSeconds >= minimumWatchTime;

  const handleQuizClick = () => {
    if (!canTakeQuiz && !progress?.quizCompleted) {
      toast.error(`Please watch at least ${formatTime(minimumWatchTime)} (${Math.ceil(minimumWatchTime / 60)} min) of the video first.`);
      return;
    }

    if (!miniTraining?.miniQuiz) {
      toast.error("No quiz available for this mini training.");
      return;
    }

    // Open quiz modal
    setIsQuizModalOpen(true);
  };

  const handleQuizComplete = async () => {
    // Close quiz modal first
    setIsQuizModalOpen(false);
    // Use setTimeout to defer callbacks to avoid render-time updates
    setTimeout(async () => {
      await fetchMiniTraining();
      if (onComplete) {
        onComplete();
      }
    }, 0);
  };

  if (!isOpen) return null;

  // Show only progress bar during loading (no modal background or close button)
  if (isLoading) {
    return (
      <div className={styles.modalOverlay} onClick={handleClose}>
        <div className={styles.loadingContainer}>
          <AnimatedProgressBar size="md" showArrow={false} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
          <X size={18} />
        </button>

        {miniTraining ? (
          <>
            {/* Title */}
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{miniTraining.title}</h2>
            </div>

            {/* Description */}
            {miniTraining.description && (
              <p className={styles.modalDescription}>{miniTraining.description}</p>
            )}

            {/* Video Player */}
            {videoUrl && embedUrl && (
              <div ref={videoContainerRef} className={styles.videoContainer}>
                {isYouTube ? (
                  <>
                    <div id="mini-training-youtube-player" className={styles.youtubePlayer} />
                    {!isVideoPlaying && (
                      <div 
                        className={styles.youtubeOverlay}
                        onClick={() => {
                          if (
                            youtubePlayerRef.current &&
                            typeof youtubePlayerRef.current.playVideo === "function"
                          ) {
                            try {
                              // Ensure position is set right before playing (backup in case onReady seek didn't work)
                              const savedPosition = progress?.videoProgress 
                                ? Math.floor((progress.videoProgress / 100) * (actualVideoDuration || miniTraining?.videoDuration || 0))
                                : 0;
                              const duration = actualVideoDuration || miniTraining?.videoDuration || 0;
                              if (savedPosition > 0 && savedPosition < duration * 0.95 && duration > 0) {
                                try {
                                  // Always seek right before playing to ensure position is correct
                                  youtubePlayerRef.current.seekTo(savedPosition, true);
                                  if (!hasResumed) {
                                    toast.success(`Resuming from ${formatTime(savedPosition)}`);
                                    setHasResumed(true);
                                  }
                                } catch (error) {
                                  console.error("[Mini Training YouTube] Error seeking to saved position:", error);
                                }
                              }
                              youtubePlayerRef.current.playVideo();
                              setIsVideoPlaying(true);
                              setIsPlaying(true);
                            } catch (error) {
                              console.error("[Mini Training YouTube] Error playing:", error);
                              toast.error("Failed to play video. Please try again.");
                            }
                          } else {
                            toast.error("Video player is not ready. Please wait a moment.");
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    )}
                  </>
                ) : (
                  <div className={styles.videoPlayer}>
                    {!isVideoPlaying ? (
                      <div 
                        className={styles.videoThumbnail}
                        onClick={() => {
                          console.log("[Direct Video] Thumbnail clicked - starting playback");
                          // Ensure position is set right before playing (backup in case onLoadedMetadata didn't work)
                          if (videoRef.current) {
                            const savedPosition = progress?.videoProgress 
                              ? Math.floor((progress.videoProgress / 100) * (actualVideoDuration || miniTraining?.videoDuration || 0))
                              : 0;
                            const duration = actualVideoDuration || miniTraining?.videoDuration || 0;
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
                      />
                    ) : (
                      <video
                        ref={videoRef}
                        src={embedUrl}
                        controls
                        className={styles.video}
                        onLoadedMetadata={() => {
                          // Set saved position when video metadata is loaded
                          if (videoRef.current && !hasResumed) {
                            const savedPosition = progress?.videoProgress 
                              ? Math.floor((progress.videoProgress / 100) * (videoRef.current.duration || miniTraining?.videoDuration || 0))
                              : 0;
                            const duration = videoRef.current.duration || miniTraining?.videoDuration || 0;
                            if (savedPosition > 0 && savedPosition < duration * 0.95 && duration > 0) {
                              videoRef.current.currentTime = savedPosition;
                              setHasResumed(true);
                              toast.success(`Resuming from ${formatTime(savedPosition)}`);
                            }
                            setActualVideoDuration(videoRef.current.duration || null);
                          }
                        }}
                        onPlay={() => {
                          setIsVideoPlaying(true);
                          setIsPlaying(true);
                        }}
                        onPause={() => {
                          setIsVideoPlaying(false);
                          setIsPlaying(false);
                          // Save progress when pausing - always save (force=true) to capture exact position
                          if (videoRef.current) {
                            const currentTime = videoRef.current.currentTime || 0;
                            if (currentTime > 0) {
                              saveProgressImmediately(Math.floor(currentTime), false, true);
                            } else if (watchedSeconds > 0) {
                              // Fallback to watchedSeconds if currentTime is 0
                              saveProgressImmediately(watchedSeconds, false, true);
                            }
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
                          const duration = actualVideoDuration || miniTraining?.videoDuration || 0;
                          setWatchedSeconds(duration);
                          // Save final progress - always save (force=true)
                          saveProgressImmediately(duration, false, true);
                        }}
                      />
                    )}
                  </div>
                )}
                {/* Fullscreen Button */}
                <button
                  className={styles.fullscreenButton}
                  onClick={handleFullscreen}
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
              </div>
            )}

                {/* Progress Timer Overlay - Same as main training */}
                {videoDuration > 0 && (
                  <div className={styles.progressTimerOverlay}>
                    <div className={styles.progressTimerHeader}>
                      <span className={styles.timerLabel}>
                        {formatTime(watchedSeconds)} / {formatTime(videoDuration)}
                      </span>
                    </div>
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
                  </div>
                )}
              </div>
            )}

            {/* Quiz Button - Right below video, very close */}
            {miniTraining.miniQuiz && (
              <div className={styles.quizButtonSection}>
                <Button
                  variant={progress?.quizCompleted ? "secondary" : isQuizUnlocked ? "primary" : "outline"}
                  onClick={handleQuizClick}
                  disabled={!isQuizUnlocked && !progress?.quizCompleted}
                  size="sm"
                  className={`${styles.quizButton} ${isQuizUnlocked && !progress?.quizCompleted ? styles.quizUnlocked : ""}`}
                >
                  {progress?.quizCompleted ? "Retake Quiz" : isQuizUnlocked ? "Take Quiz" : "Quiz Locked"}
                </Button>
                {!isQuizUnlocked && !progress?.quizCompleted && (
                  <p className={styles.quizHint}>
                    Watch {formatTime(minimumWatchTime)} ({Math.ceil(minimumWatchTime / 60)} min) to unlock the quiz
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className={styles.errorContainer}>
            <p>Failed to load mini training</p>
          </div>
        )}
      </div>

      {/* Mini Quiz Modal */}
      {miniTraining?.miniQuiz && (
        <MiniQuizModal
          isOpen={isQuizModalOpen}
          onClose={() => setIsQuizModalOpen(false)}
          miniTrainingId={miniTrainingId}
          quiz={{
            id: miniTraining.miniQuiz.id,
            title: miniTraining.miniQuiz.title,
            passingScore: miniTraining.miniQuiz.passingScore,
            questions: Array.isArray(miniTraining.miniQuiz.questions) 
              ? miniTraining.miniQuiz.questions 
              : [],
          }}
          onComplete={handleQuizComplete}
        />
      )}
    </div>
  );
};

// YouTube Player API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

