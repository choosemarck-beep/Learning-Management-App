"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, CheckCircle2, BookOpen } from "lucide-react";
import styles from "./NetflixCourseCard.module.css";

interface NetflixCourseCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    thumbnail?: string | null;
    totalXP: number;
    progress: number;
    isCompleted: boolean;
    isEnrolled: boolean;
  };
}

export const NetflixCourseCard: React.FC<NetflixCourseCardProps> = ({
  course,
}) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    router.push(`/courses/${course.id}`);
  };

  return (
    <div
      className={styles.card}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`View ${course.title} course`}
    >
      <div className={styles.thumbnailContainer}>
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className={styles.thumbnail}
          />
        ) : (
          <div className={styles.thumbnailPlaceholder}>
            <BookOpen size={40} className={styles.placeholderIcon} />
          </div>
        )}
        
        {/* Progress overlay */}
        {course.isEnrolled && course.progress > 0 && (
          <div className={styles.progressOverlay}>
            <div
              className={styles.progressBar}
              style={{ width: `${course.progress}%` }}
            />
          </div>
        )}

        {/* Hover overlay with play button */}
        {isHovered && (
          <div className={styles.hoverOverlay}>
            <div className={styles.playButton}>
              <Play size={24} fill="currentColor" />
            </div>
            {course.isCompleted && (
              <div className={styles.completedBadge}>
                <CheckCircle2 size={20} />
              </div>
            )}
          </div>
        )}

        {/* Completed badge (always visible if completed) */}
        {course.isCompleted && !isHovered && (
          <div className={styles.completedBadgeStatic}>
            <CheckCircle2 size={18} />
          </div>
        )}
      </div>

      {/* Course info */}
      <div className={styles.info}>
        <h3 className={styles.title}>{course.title}</h3>
        <div className={styles.meta}>
          <span className={styles.xp}>{course.totalXP} XP</span>
          {course.isEnrolled && (
            <span className={styles.progressText}>
              {Math.round(course.progress)}% Complete
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

