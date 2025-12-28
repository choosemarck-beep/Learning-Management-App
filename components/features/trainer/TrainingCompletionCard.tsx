"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { X, BookOpen } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import styles from "./TrainingCompletionCard.module.css";

interface TrainingCompletionCardProps {
  trainingId: string;
  title: string;
  completionRate: number;
  totalAssigned: number;
  totalCompleted: number;
  courseId?: string;
  courseTitle?: string;
  onRemove: (trainingId: string) => void;
}

export const TrainingCompletionCard: React.FC<TrainingCompletionCardProps> = ({
  trainingId,
  title,
  completionRate,
  totalAssigned,
  totalCompleted,
  courseId,
  courseTitle,
  onRemove,
}) => {
  const router = useRouter();

  const handleEdit = () => {
    if (courseId) {
      router.push(`/employee/trainer/workshop/courses/${courseId}`);
    }
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
          onClick={() => onRemove(trainingId)}
          aria-label="Remove training from dashboard"
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
        <div className={styles.trainingInfo}>
          <h3 className={styles.trainingTitle}>{title}</h3>
          {courseTitle && (
            <div className={styles.courseInfo}>
              <BookOpen size={14} />
              <span className={styles.courseTitle}>{courseTitle}</span>
            </div>
          )}
          <div className={styles.stats}>
            <span className={styles.statText}>
              {totalCompleted} / {totalAssigned} completed
            </span>
          </div>
          {courseId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className={styles.editButton}
            >
              <span>Edit Training</span>
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

