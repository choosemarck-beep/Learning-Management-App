"use client";

import React from "react";
import styles from "./TrainingCard.module.css";

interface Module {
  id: string;
  title: string;
  description: string;
  thumbnail?: string | null;
  order: number;
  totalXP: number;
}

interface Course {
  id: string;
  title: string;
}

interface TrainingCardProps {
  module: Module;
  course: Course;
  onClick: () => void;
}

export const TrainingCard: React.FC<TrainingCardProps> = ({
  module,
  course,
  onClick,
}) => {
  return (
    <button
      className={styles.card}
      onClick={onClick}
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
            {/* Placeholder - no play icon */}
          </div>
        )}
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{module.title}</h3>
        {module.totalXP > 0 && (
          <span className={styles.xp}>{module.totalXP} XP</span>
        )}
      </div>
    </button>
  );
};

