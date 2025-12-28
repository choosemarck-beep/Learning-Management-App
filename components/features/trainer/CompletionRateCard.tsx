"use client";

import React from "react";
import { Card, CardBody } from "@/components/ui/Card";
import styles from "./CompletionRateCard.module.css";

interface CompletionRateCardProps {
  overallCompletionRate: number;
  totalAssigned: number;
  totalCompleted: number;
}

export const CompletionRateCard: React.FC<CompletionRateCardProps> = ({
  overallCompletionRate,
  totalAssigned,
  totalCompleted,
}) => {
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (overallCompletionRate / 100) * circumference;

  // Determine color based on completion rate
  const getProgressColor = () => {
    if (overallCompletionRate >= 80) {
      return "var(--color-status-success)"; // Green
    } else if (overallCompletionRate >= 50) {
      return "var(--color-status-warning)"; // Yellow/Amber
    } else {
      return "var(--color-status-error)"; // Red
    }
  };

  return (
    <Card className={styles.card}>
      <CardBody>
        <div className={styles.header}>
          <h2 className={styles.title}>Overall Completion Rate</h2>
        </div>
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
              {Math.round(overallCompletionRate)}%
            </span>
          </div>
        </div>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Completed</span>
            <span className={styles.statValue}>{totalCompleted}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Assigned</span>
            <span className={styles.statValue}>{totalAssigned}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

