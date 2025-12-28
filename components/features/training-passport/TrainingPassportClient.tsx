"use client";

import React, { useState, useEffect } from "react";
import { TrainingBadge } from "./TrainingBadge";
import toast from "react-hot-toast";
import styles from "./TrainingPassportClient.module.css";

export interface MandatoryTraining {
  id: string;
  title: string;
  description: string | null;
  badgeIcon: string | null;
  badgeColor: string | null;
  progress: number;
  isCompleted: boolean;
}

export const TrainingPassportClient: React.FC = () => {
  const [trainings, setTrainings] = useState<MandatoryTraining[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/training-passport");
      const data = await response.json();

      if (data.success) {
        setTrainings(data.data.trainings);
      } else {
        toast.error(data.error || "Failed to load trainings");
      }
    } catch (error) {
      console.error("Error fetching trainings:", error);
      toast.error("Failed to load trainings");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading training passport...</p>
      </div>
    );
  }

  if (trainings.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No mandatory trainings available yet.</p>
        <p className={styles.emptySubtext}>
          Trainings will appear here once trainers create them.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Training Passport</h1>
        <p className={styles.subtitle}>
          Complete mandatory trainings to unlock badges
        </p>
      </div>

      <div className={styles.badgesGrid}>
        {trainings.map((training) => (
          <TrainingBadge
            key={training.id}
            id={training.id}
            title={training.title}
            description={training.description}
            progress={training.progress}
            isCompleted={training.isCompleted}
            badgeIcon={training.badgeIcon}
            badgeColor={training.badgeColor}
          />
        ))}
      </div>
    </div>
  );
};

