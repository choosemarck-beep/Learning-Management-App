"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { X, BookOpen } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import styles from "./CourseCompletionCard.module.css";

interface CourseCompletionCardProps {
  courseId: string;
  title: string;
  completionRate: number;
  totalAssigned: number;
  totalCompleted: number;
  trainingCount: number;
  onRemove: (courseId: string) => void;
}

export const CourseCompletionCard: React.FC<CourseCompletionCardProps> = ({
  courseId,
  title,
  completionRate,
  totalAssigned,
  totalCompleted,
  trainingCount,
  onRemove,
}) => {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/employee/trainer/workshop/courses/${courseId}`);
  };
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (completionRate / 100) * circumference;

  // Determine color based on completion rate
  const getProgressColor = () => {
    if (completionRate >= 80) {
      return "var(--color-status-success)"; // Green
    } else if (completionRate >= 50) {
      return "var(--color-status-warning)"; // Yellow/Amber
    } else {
      return "var(--color-status-error)"; // Red
    }
  };

  return (
    <Card className={styles.card}>
      <CardBody>
        <button
          className={styles.removeButton}
          onClick={() => onRemove(courseId)}
          aria-label="Remove course from dashboard"
        >
          <X size={16} />
        </button>
        <div className={styles.chartContainer}>
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
              stroke={getProgressColor()}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              className={styles.progressPath}
            />
          </svg>
          <div className={styles.percentage}>
            <span className={styles.percentageValue}>
              {Math.round(completionRate)}%
            </span>
          </div>
        </div>
        <div className={styles.courseInfo}>
          <h3 className={styles.courseTitle}>{title}</h3>
          <div className={styles.courseMeta}>
            <BookOpen size={14} />
            <span className={styles.metaText}>Course</span>
            <span className={styles.trainingCount}>{trainingCount} training{trainingCount !== 1 ? 's' : ''}</span>
          </div>
          <div className={styles.stats}>
            <span className={styles.statText}>
              {totalCompleted} / {totalAssigned} completed
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className={styles.editButton}
          >
            <span>Edit Course</span>
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

