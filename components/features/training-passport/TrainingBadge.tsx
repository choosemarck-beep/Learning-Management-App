"use client";

import React from "react";
import { motion } from "framer-motion";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import styles from "./TrainingBadge.module.css";

export interface TrainingBadgeProps {
  id: string;
  title: string;
  description?: string | null;
  progress: number; // 0-100
  isCompleted: boolean;
  badgeIcon?: string | null;
  badgeColor?: string | null;
}

export const TrainingBadge: React.FC<TrainingBadgeProps> = ({
  title,
  description,
  progress,
  isCompleted,
  badgeIcon,
  badgeColor,
}) => {
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      className={cn(
        styles.badgeContainer,
        isCompleted && styles.completed
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.badgeWrapper}>
        {/* Circular Progress SVG */}
        <svg
          className={styles.progressCircle}
          width="120"
          height="120"
          viewBox="0 0 120 120"
        >
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="rgba(139, 92, 246, 0.2)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={isCompleted ? "var(--color-primary-purple)" : "rgba(139, 92, 246, 0.5)"}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            className={styles.progressPath}
          />
        </svg>

        {/* Badge Icon/Content */}
        <div
          className={cn(
            styles.badgeContent,
            isCompleted && styles.badgeContentCompleted
          )}
          style={{
            color: badgeColor || undefined,
          }}
        >
          {badgeIcon ? (
            <span className={styles.badgeIconText}>{badgeIcon}</span>
          ) : (
            <Award
              size={32}
              className={styles.badgeIcon}
              fill={isCompleted ? "currentColor" : "none"}
            />
          )}
        </div>

        {/* Progress Percentage */}
        <div className={styles.progressText}>
          <span className={styles.progressNumber}>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Training Info */}
      <div className={styles.trainingInfo}>
        <h3 className={styles.trainingTitle}>{title}</h3>
        {description && (
          <p className={styles.trainingDescription}>{description}</p>
        )}
      </div>
    </motion.div>
  );
};

