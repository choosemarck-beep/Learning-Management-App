"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Play, Lock, CheckCircle2, FileQuestion } from "lucide-react";
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
              // Paused
              setIsPlaying(false);
              setIsVideoPlaying(false);
              stopYouTubeTracking();
            } else if (event.data === 0) {
              // Ended
              setIsPlaying(false);
              setIsVideoPlaying(false);
              stopYouTubeTracking();
              const duration = miniTraining?.videoDuration || 0;
              setWatchedSeconds(duration);
              if (progress?.quizCompleted) {
                updateVideoProgress(duration, false);
              }
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
            // Update progress every 5 seconds (only if quiz passed)
            // The updateVideoProgress function checks if quiz is passed
            if (seconds % 5 === 0) {
              updateVideoProgress(seconds, true);
            }
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
  // Disabled until quiz is passed (same as main training)
  const updateVideoProgress = async (seconds: number, playing: boolean) => {
    // Don't update progress if quiz is not passed
    if (!progress?.quizCompleted) {
      return;
    }

    try {
      const response = await fetch(`/api/mini-trainings/${miniTrainingId}/watch-progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          watchedSeconds: seconds,
          isPlaying: playing,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setWatchedSeconds(result.data.watchedSeconds || seconds);
          if (result.data.progress !== undefined) {
            setProgress((prev) => (prev ? { ...prev, videoProgress: result.data.videoProgress || prev.videoProgress } : null));
          }
        }
      }
    } catch (error) {
      console.error("Error updating mini training progress:", error);
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

  const handleClose = () => {
    // Stop any tracking
    stopYouTubeTracking();
    setIsVideoPlaying(false);
    setIsPlaying(false);
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
              <div className={styles.videoContainer}>
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
                          setIsVideoPlaying(true);
                          setIsPlaying(true);
                          if (videoRef.current) {
                            videoRef.current.play();
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    ) : (
                      <video
                        ref={videoRef}
                        src={embedUrl}
                        controls
                        className={styles.video}
                        onPlay={() => {
                          setIsVideoPlaying(true);
                          setIsPlaying(true);
                        }}
                        onPause={() => {
                          setIsVideoPlaying(false);
                          setIsPlaying(false);
                        }}
                        onTimeUpdate={(e) => {
                          const video = e.currentTarget;
                          const seconds = Math.floor(video.currentTime);
                          setWatchedSeconds(seconds);
                          // Update progress every 5 seconds (only if quiz passed)
                          if (seconds % 5 === 0 && progress?.quizCompleted) {
                            updateVideoProgress(seconds, !video.paused);
                          }
                        }}
                        onEnded={() => {
                          setWatchedSeconds(videoDuration);
                          if (progress?.quizCompleted) {
                            updateVideoProgress(videoDuration, false);
                          }
                        }}
                      />
                    )}
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

