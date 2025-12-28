"use client";

import React, { useEffect, useState } from "react";
import styles from "./Logo.module.css";

export interface LogoProps {
  className?: string;
  showProgressBar?: boolean;
  progress?: number; // 0-100, defaults to ~66% to match the image
  imageUrl?: string; // Optional: override API fetch with direct URL
}

export const Logo: React.FC<LogoProps> = ({
  className,
  showProgressBar = true,
  progress = 66,
  imageUrl: propImageUrl,
}) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(propImageUrl || null);
  const filledSegments = Math.floor((progress / 100) * 20);

  useEffect(() => {
    // If imageUrl prop is provided, use it directly
    if (propImageUrl !== undefined) {
      setLogoUrl(propImageUrl);
      return;
    }

    // Otherwise, fetch from API
    const fetchLogo = async () => {
      try {
        const response = await fetch("/api/logo");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.imageUrl) {
            setLogoUrl(data.data.imageUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching logo:", error);
        // Silently fail and use default text logo
      }
    };

    fetchLogo();
  }, [propImageUrl]);

  return (
    <div className={`${styles.logoContainer} ${className || ""}`}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="Learning Management"
          className={styles.logoImage}
        />
      ) : (
        <div className={styles.logoText}>
          <span className={styles.line1}>LEARNING</span>
          <span className={styles.line2}>MANAGEMENT</span>
        </div>
      )}
      {showProgressBar && (
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            {Array.from({ length: 20 }).map((_, index) => {
              const isFilled = index < filledSegments;
              return (
                <div
                  key={index}
                  className={`${styles.progressSegment} ${
                    isFilled ? styles.filled : styles.empty
                  }`}
                />
              );
            })}
          </div>
          <div className={styles.arrow} />
        </div>
      )}
    </div>
  );
};

