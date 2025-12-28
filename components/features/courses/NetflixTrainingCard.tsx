"use client";

import React, { useState } from "react";
import { Play, CheckCircle2, BookOpen } from "lucide-react";
import styles from "./NetflixTrainingCard.module.css";

interface Module {
  id: string;
  title: string;
  description: string;
  thumbnail?: string | null;
  order: number;
  totalXP: number;
  miniTrainingCount?: number;
  lessonCount?: number; // For backward compatibility
}

interface Course {
  id: string;
  title: string;
}

interface NetflixTrainingCardProps {
  module: Module;
  course: Course;
  onClick: () => void;
}

export const NetflixTrainingCard: React.FC<NetflixTrainingCardProps> = ({
  module,
  course,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={styles.card}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`View ${module.title} training`}
    >
      <div className={styles.thumbnailContainer}>
        {module.thumbnail ? (
          <img
            src={module.thumbnail}
            alt={module.title}
            className={styles.thumbnail}
          />
        ) : (
          <div className={styles.thumbnailPlaceholder}>
            <BookOpen size={40} className={styles.placeholderIcon} />
          </div>
        )}

        {/* Hover overlay with play button */}
        {isHovered && (
          <div className={styles.hoverOverlay}>
            <div className={styles.playButton}>
              <Play size={24} fill="currentColor" />
            </div>
          </div>
        )}
      </div>

      {/* Training info */}
      <div className={styles.info}>
        <h3 className={styles.title}>{module.title}</h3>
        <div className={styles.meta}>
          <span className={styles.xp}>{module.totalXP} XP</span>
          {(module.miniTrainingCount || 0) > 0 && (
            <span className={styles.lessonCount}>
              {module.miniTrainingCount} {module.miniTrainingCount === 1 ? "Mini Training" : "Mini Trainings"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

