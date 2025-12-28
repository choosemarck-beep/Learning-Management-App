"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { NetflixTrainingCard } from "./NetflixTrainingCard";
import { HorizontalScrollContainer } from "./NetflixCoursesView";
import styles from "./NetflixCourseDetailClient.module.css";

interface Training {
  id: string;
  title: string;
  description: string;
  thumbnail?: string | null;
  order: number;
  totalXP: number;
  miniTrainingCount: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string | null;
  totalXP: number;
  progress: number;
  isCompleted: boolean;
  isEnrolled: boolean;
  trainings: Training[];
}

interface NetflixCourseDetailClientProps {
  course: Course;
}

export const NetflixCourseDetailClient: React.FC<NetflixCourseDetailClientProps> = ({
  course,
}) => {
  const router = useRouter();

  const handleBack = () => {
    router.push("/courses");
  };

  const handleTrainingClick = (training: Training) => {
    console.log("[NetflixCourseDetailClient] Training clicked:", {
      id: training.id,
      title: training.title,
      navigatingTo: `/training/${training.id}/video`,
    });
    
    try {
      // Phase 4: User-Friendly Error Messages - Navigate with error handling
      // Navigate directly to video page (LMS best practice - skip preview for better UX)
      // If video doesn't exist, the server will redirect to preview page
      // If there's an error, the server will redirect to courses with error message
      router.push(`/training/${training.id}/video`);
    } catch (error) {
      console.error("[NetflixCourseDetailClient] Error navigating to training:", error);
      // Phase 4: Show user-friendly error message
      toast.error("Unable to open training. Please try again.", {
        duration: 4000,
      });
      // Fallback to preview page if navigation fails
      setTimeout(() => {
        router.push(`/training/${training.id}/preview`);
      }, 100);
    }
  };

  // Group trainings by status
  const enrolledTrainings = course.trainings; // For now, all trainings are available
  const availableTrainings = course.trainings;

  return (
    <div className={styles.container}>
      {/* Header with back button and course info */}
      <div className={styles.header}>
        <button
          onClick={handleBack}
          className={styles.backButton}
          aria-label="Back to courses"
        >
          <ArrowLeft size={24} />
        </button>

        {/* Course Hero Section */}
        <div className={styles.heroSection}>
          {course.thumbnail ? (
            <div className={styles.heroImageContainer}>
              <img
              src={course.thumbnail}
              alt={course.title}
              className={styles.heroImage}
            />
            </div>
          ) : (
            <div className={styles.heroPlaceholder}>
              <div className={styles.heroPlaceholderContent}>
                <h1 className={styles.heroTitle}>{course.title}</h1>
              </div>
            </div>
          )}

          {/* Course Info Overlay */}
          <div className={styles.heroInfo}>
            <h1 className={styles.courseTitle}>{course.title}</h1>
            <p className={styles.courseDescription}>{course.description}</p>
            
            <div className={styles.courseMeta}>
              <span className={styles.xpBadge}>{course.totalXP} XP</span>
              {course.isEnrolled && (
                <span className={styles.progressBadge}>
                  {Math.round(course.progress)}% Complete
                </span>
              )}
            </div>

            {course.isEnrolled && course.progress > 0 && (
              <div className={styles.progressBarContainer}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trainings Section */}
      <div className={styles.trainingsSection}>
        {availableTrainings.length > 0 ? (
          <div className={styles.trainingsRow}>
            <div className={styles.rowHeader}>
              <h2 className={styles.rowTitle}>Trainings</h2>
              <span className={styles.moduleCount}>
                {availableTrainings.length} {availableTrainings.length === 1 ? "Training" : "Trainings"}
              </span>
            </div>
            <HorizontalScrollContainer>
              {availableTrainings.map((training) => (
                <NetflixTrainingCard
                  key={training.id}
                  module={training}
                  course={course}
                  onClick={() => handleTrainingClick(training)}
                />
              ))}
            </HorizontalScrollContainer>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>No trainings available in this course yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

