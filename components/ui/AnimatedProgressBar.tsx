"use client";

import React from "react";
import styles from "./AnimatedProgressBar.module.css";

export interface AnimatedProgressBarProps {
  /**
   * Progress value (0-100). If undefined, shows as indeterminate/loading animation.
   */
  progress?: number;
  /**
   * Number of segments in the progress bar (default: 20)
   */
  segments?: number;
  /**
   * Show arrow at the end (default: true)
   */
  showArrow?: boolean;
  /**
   * Size variant: 'sm' | 'md' | 'lg' (default: 'md')
   */
  size?: "sm" | "md" | "lg";
  /**
   * Custom className for the container
   */
  className?: string;
  /**
   * Custom max-width for the progress bar
   */
  maxWidth?: string;
}

/**
 * AnimatedProgressBar - A reusable animated progress bar component
 * extracted from the Learning Management Logo.
 * 
 * Can be used as:
 * - Loading indicator (no progress prop = indeterminate)
 * - Progress indicator (with progress prop = determinate)
 * 
 * @example
 * // Loading indicator (indeterminate)
 * <AnimatedProgressBar />
 * 
 * @example
 * // Progress indicator (determinate)
 * <AnimatedProgressBar progress={75} />
 * 
 * @example
 * // Small size without arrow
 * <AnimatedProgressBar size="sm" showArrow={false} />
 */
export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  segments = 20,
  showArrow = true,
  size = "md",
  className,
  maxWidth,
}) => {
  // For indeterminate/loading mode, animate all segments
  // For determinate mode, fill segments based on progress
  const filledSegments = progress !== undefined
    ? Math.floor((Math.min(Math.max(progress, 0), 100) / 100) * segments)
    : segments; // All segments filled for indeterminate animation

  const containerStyle = maxWidth ? { maxWidth } : undefined;

  return (
    <div
      className={`${styles.progressContainer} ${styles[size]} ${className || ""}`}
      style={containerStyle}
      role="progressbar"
      aria-valuenow={progress !== undefined ? progress : undefined}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={progress !== undefined ? `Progress: ${progress}%` : "Loading"}
    >
      <div className={styles.progressBar}>
        {Array.from({ length: segments }).map((_, index) => {
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
      {showArrow && <div className={styles.arrow} />}
    </div>
  );
};

