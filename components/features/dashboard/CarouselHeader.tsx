"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./CarouselHeader.module.css";

export interface CarouselImage {
  id: string;
  imageUrl: string;
  title?: string | null;
  description?: string | null;
  redirectUrl?: string | null;
}

export type CarouselMode = "PHOTO_CAROUSEL" | "VIDEO";

export interface CarouselHeaderProps {
  mode: CarouselMode;
  images: CarouselImage[];
  videoUrl?: string | null;
  autoPlayInterval?: number; // milliseconds (for photo carousel)
}

export const CarouselHeader: React.FC<CarouselHeaderProps> = ({
  mode,
  images,
  videoUrl,
  autoPlayInterval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-play functionality for photo carousel
  useEffect(() => {
    if (mode === "VIDEO") {
      // Video mode - ensure video loops
      if (videoRef.current) {
        videoRef.current.loop = true;
        videoRef.current.play().catch((e) => {
          console.error("Video autoplay failed:", e);
        });
      }
      return;
    }

    if (images.length <= 1 || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoPlayInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [mode, images.length, autoPlayInterval, isPaused]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 10000);
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (mode === "VIDEO") return; // No swipe for video

    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      goToNext();
    } else if (distance < -minSwipeDistance) {
      goToPrevious();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Video mode
  if (mode === "VIDEO") {
    if (!videoUrl) {
      return null; // Don't render if no video URL
    }
    return (
      <div className={styles.carousel}>
        <div className={styles.carouselContainer}>
          <video
            ref={videoRef}
            src={videoUrl}
            loop
            autoPlay
            playsInline
            muted
            className={styles.video}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    );
  }

  // Photo carousel mode
  if (mode === "PHOTO_CAROUSEL") {
    if (!images || images.length === 0) {
      return null;
    }
  } else {
    // Invalid mode, don't render
    return null;
  }

  return (
    <div
      className={styles.carousel}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={styles.carouselContainer}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className={styles.slide}
          >
            <img
              src={images[currentIndex].imageUrl}
              alt={images[currentIndex].title || "Carousel image"}
              className={`${styles.image} ${images[currentIndex].redirectUrl ? styles.clickable : ''}`}
              onClick={() => {
                if (images[currentIndex].redirectUrl) {
                  window.location.href = images[currentIndex].redirectUrl!;
                }
              }}
              style={{
                cursor: images[currentIndex].redirectUrl ? 'pointer' : 'default',
              }}
              onError={(e) => {
                // Fallback to placeholder on error
                e.currentTarget.src = '/placeholder-carousel.png';
                e.currentTarget.onerror = null; // Prevent infinite loop
              }}
            />
            {(images[currentIndex].title || images[currentIndex].description) && (
              <div className={styles.overlay}>
                {images[currentIndex].title && (
                  <h3 className={styles.title}>{images[currentIndex].title}</h3>
                )}
                {images[currentIndex].description && (
                  <p className={styles.description}>
                    {images[currentIndex].description}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Dots Indicator - Removed to reduce distraction */}
      </div>
    </div>
  );
};
