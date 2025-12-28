"use client";

import React, { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { VideoReel } from "./VideoReel";
import toast from "react-hot-toast";
import styles from "./ReelsPageClient.module.css";

export interface Video {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnail: string | null;
  duration: number | null;
  category: string | null;
  views: number;
  createdAt: Date;
}

export const ReelsPageClient: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const isScrolling = useRef(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/reels");
      const data = await response.json();

      if (data.success) {
        setVideos(data.data.videos);
      } else {
        toast.error(data.error || "Failed to load videos");
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast.error("Failed to load videos");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle touch events for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!touchStartY.current || !touchEndY.current || isScrolling.current) {
      return;
    }

    const distance = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50;

    if (Math.abs(distance) > minSwipeDistance) {
      isScrolling.current = true;
      if (distance > 0) {
        // Swipe up - next video
        goToNext();
      } else {
        // Swipe down - previous video
        goToPrevious();
      }
      setTimeout(() => {
        isScrolling.current = false;
      }, 500);
    }

    touchStartY.current = null;
    touchEndY.current = null;
  };

  // Handle wheel events for desktop scrolling
  const handleWheel = (e: React.WheelEvent) => {
    if (isScrolling.current) {
      e.preventDefault();
      return;
    }

    if (e.deltaY > 0) {
      // Scroll down - next video
      goToNext();
    } else if (e.deltaY < 0) {
      // Scroll up - previous video
      goToPrevious();
    }
  };

  const goToNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Scroll to current video
  useEffect(() => {
    if (containerRef.current) {
      const videoElement = containerRef.current.children[currentIndex] as HTMLElement;
      if (videoElement) {
        videoElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [currentIndex]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <p>Loading videos...</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyMessage}>No training videos available.</p>
      </div>
    );
  }

  return (
    <div
      className={styles.container}
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {videos.map((video, index) => (
        <VideoReel
          key={video.id}
          video={video}
          isActive={index === currentIndex}
          onNext={goToNext}
          onPrevious={goToPrevious}
        />
      ))}
    </div>
  );
};
