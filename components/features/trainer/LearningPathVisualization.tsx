"use client";

import React from "react";
import { CheckCircle2, Circle, Lock, Play } from "lucide-react";
import styles from "./LearningPathVisualization.module.css";

interface Training {
  id: string;
  title: string;
  order: number;
  isPublished: boolean;
  isCompleted?: boolean;
  isLocked?: boolean;
}

interface LearningPathVisualizationProps {
  trainings: Training[];
  courseTitle?: string;
}

export const LearningPathVisualization: React.FC<LearningPathVisualizationProps> = ({
  trainings,
  courseTitle,
}) => {
  const sortedTrainings = [...trainings].sort((a, b) => a.order - b.order);

  return (
    <div className={styles.container}>
      {courseTitle && <h3 className={styles.title}>{courseTitle}</h3>}
      <div className={styles.path}>
        {sortedTrainings.map((training, index) => (
          <React.Fragment key={training.id}>
            <div className={styles.node}>
              <div
                className={`${styles.nodeCircle} ${
                  training.isCompleted
                    ? styles.completed
                    : training.isLocked
                    ? styles.locked
                    : styles.available
                }`}
              >
                {training.isCompleted ? (
                  <CheckCircle2 size={24} />
                ) : training.isLocked ? (
                  <Lock size={20} />
                ) : (
                  <Play size={20} />
                )}
              </div>
              <div className={styles.nodeLabel}>
                <span className={styles.nodeNumber}>{index + 1}</span>
                <span className={styles.nodeTitle}>{training.title}</span>
              </div>
            </div>
            {index < sortedTrainings.length - 1 && (
              <div
                className={`${styles.connector} ${
                  training.isCompleted ? styles.connectorCompleted : ""
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

