"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseVideoWatchTimerProps {
  lessonId: string;
  initialWatchedSeconds?: number;
  minimumWatchTime?: number;
  onProgressUpdate?: (watchedSeconds: number, canTakeQuiz: boolean) => void;
}

interface UseVideoWatchTimerReturn {
  watchedSeconds: number;
  canTakeQuiz: boolean;
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  updateProgress: () => Promise<void>;
  reset: () => void;
}

export function useVideoWatchTimer({
  lessonId,
  initialWatchedSeconds = 0,
  minimumWatchTime = 0,
  onProgressUpdate,
}: UseVideoWatchTimerProps): UseVideoWatchTimerReturn {
  const [watchedSeconds, setWatchedSeconds] = useState(initialWatchedSeconds);
  const [isTracking, setIsTracking] = useState(false);
  const [canTakeQuiz, setCanTakeQuiz] = useState(
    initialWatchedSeconds >= minimumWatchTime
  );

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const accumulatedSecondsRef = useRef<number>(0);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update canTakeQuiz when watchedSeconds changes
  useEffect(() => {
    const canTake = watchedSeconds >= minimumWatchTime;
    setCanTakeQuiz(canTake);
    if (onProgressUpdate) {
      onProgressUpdate(watchedSeconds, canTake);
    }
  }, [watchedSeconds, minimumWatchTime, onProgressUpdate]);

  const updateProgress = useCallback(async () => {
    // Clear any pending update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce updates (wait 2 seconds after last change)
    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/lessons/${lessonId}/watch-progress`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              watchedSeconds: watchedSeconds,
              isPlaying: isTracking,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setWatchedSeconds(data.data.watchedSeconds);
            setCanTakeQuiz(data.data.canTakeQuiz);
          }
        }
      } catch (error) {
        console.error("Error updating watch progress:", error);
      }
    }, 2000);
  }, [lessonId, watchedSeconds, isTracking]);

  const stopTracking = useCallback(() => {
    if (!isTracking) return;

    setIsTracking(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Save accumulated seconds
    if (accumulatedSecondsRef.current > 0) {
      setWatchedSeconds((prev) => prev + accumulatedSecondsRef.current);
      accumulatedSecondsRef.current = 0;
    }

    // Update backend
    updateProgress();
  }, [isTracking, updateProgress]);

  const startTracking = useCallback(() => {
    if (isTracking) return;

    setIsTracking(true);
    lastUpdateRef.current = Date.now();

    // Update every second
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastUpdateRef.current) / 1000);
      lastUpdateRef.current = now;

      accumulatedSecondsRef.current += elapsed;
      setWatchedSeconds((prev) => {
        const newValue = prev + elapsed;
        return newValue;
      });
    }, 1000);
  }, [isTracking]);

  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, stop tracking
        if (isTracking) {
          stopTracking();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isTracking, stopTracking]);

  const reset = useCallback(() => {
    setWatchedSeconds(initialWatchedSeconds);
    setCanTakeQuiz(initialWatchedSeconds >= minimumWatchTime);
    setIsTracking(false);
    accumulatedSecondsRef.current = 0;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
  }, [initialWatchedSeconds, minimumWatchTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return {
    watchedSeconds,
    canTakeQuiz,
    isTracking,
    startTracking,
    stopTracking,
    updateProgress,
    reset,
  };
}

