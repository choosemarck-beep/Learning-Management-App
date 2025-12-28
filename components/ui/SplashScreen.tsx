"use client";

import React, { useState, useEffect } from "react";
import { Logo } from "./Logo";
import styles from "./SplashScreen.module.css";

interface SplashScreenImageData {
  imageUrl: string | null;
}

export interface SplashScreenProps {
  /** Duration in milliseconds for the splash screen to display */
  duration?: number;
  /** Callback when splash screen finishes loading */
  onComplete?: () => void;
  /** Whether to show the animated progress bar */
  showProgress?: boolean;
  /** Custom progress value (0-100). If not provided, will animate from 0 to 100 */
  progress?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  duration = 3000,
  onComplete,
  showProgress = true,
  progress: externalProgress,
}) => {
  const [internalProgress, setInternalProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Use external progress if provided, otherwise use internal animated progress
  const progress = externalProgress !== undefined ? externalProgress : internalProgress;

  // Fetch splash screen image from API
  useEffect(() => {
    const fetchImageUrl = async () => {
      try {
        const response = await fetch("/api/splash-screen");
        const data = await response.json();
        
        if (data.success && data.data?.imageUrl) {
          // Ensure the imageUrl is a valid path
          // If it's already a full URL, use it; otherwise prepend with base URL
          let url = data.data.imageUrl;
          if (url && !url.startsWith('http') && !url.startsWith('//')) {
            // Ensure it starts with / if it's a relative path
            if (!url.startsWith('/')) {
              url = `/${url}`;
            }
          }
          setImageUrl(url);
          console.log("Splash screen image URL loaded:", url);
        } else {
          console.log("No splash screen image found, using default gradient");
        }
      } catch (error) {
        console.error("Error fetching splash screen image:", error);
        // Fallback to default if API fails
      }
    };

    fetchImageUrl();
  }, []);

  // Animate progress from 0 to 100
  useEffect(() => {
    if (externalProgress !== undefined) {
      // If external progress is provided, don't animate
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setInternalProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(interval);
        setIsComplete(true);
        // Call onComplete after a brief delay
        setTimeout(() => {
          onComplete?.();
        }, 300);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [duration, externalProgress, onComplete]);

  return (
    <div className={styles.splashContainer}>
      {/* Background Image - The cosmic/learning themed image */}
      <div 
        className={styles.backgroundImage}
        style={imageUrl ? { 
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat'
        } : {}}
      />

      {/* Logo with Progress Bar at Top */}
      <div className={styles.logoSection}>
        <Logo showProgressBar={showProgress} progress={progress} className={styles.logo} />
      </div>

      {/* Optional: Loading text or additional content */}
      {showProgress && progress < 100 && (
        <div className={styles.loadingText}>
          <span className={styles.loadingDot} style={{ animationDelay: "0s" }} />
          <span className={styles.loadingDot} style={{ animationDelay: "0.2s" }} />
          <span className={styles.loadingDot} style={{ animationDelay: "0.4s" }} />
        </div>
      )}
    </div>
  );
};

