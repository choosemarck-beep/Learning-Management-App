"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import styles from "./TrainingPreviewPageClient.module.css";

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

interface TrainingPreviewPageClientProps {
  module: Module;
  course: Course;
  isPlaceholder: boolean;
}

export const TrainingPreviewPageClient: React.FC<TrainingPreviewPageClientProps> = ({
  module,
  course,
  isPlaceholder,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear any previous errors when component mounts or isPlaceholder changes
  useEffect(() => {
    if (isPlaceholder) {
      setError(null);
    }
  }, [isPlaceholder]);

  const handleStartTraining = async () => {
    // Don't allow starting placeholder trainings
    if (isPlaceholder) {
      setError(null); // Clear any error state
      toast.error("This is a preview training. Real trainings will be available once courses are created by administrators.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Navigate to training video page
      router.push(`/training/${module.id}/video`);
    } catch (err) {
      console.error("Error starting training:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to start training";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Back Button */}
      <button
        className={styles.backButton}
        onClick={() => router.back()}
        aria-label="Go back"
      >
        <ArrowLeft size={24} />
      </button>

      {/* Thumbnail */}
      <div className={styles.thumbnailContainer}>
        {module.thumbnail ? (
          <img
            src={module.thumbnail}
            alt={module.title}
            className={styles.thumbnail}
          />
        ) : (
          <div className={styles.thumbnailPlaceholder}>
            <Play size={64} className={styles.playIconLarge} />
          </div>
        )}
        <div className={styles.thumbnailOverlay} />
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.courseLabel}>{course.title}</span>
          <h1 className={styles.title}>{module.title}</h1>
        </div>

        <div className={styles.meta}>
          {module.totalXP > 0 && (
            <div className={styles.xpBadge}>
              <Award size={16} />
              <span>{module.totalXP} XP</span>
            </div>
          )}
        </div>

        <div className={styles.description}>
          <p>{module.description}</p>
        </div>

        <div className={styles.actions}>
          {isPlaceholder && (
            <div className={styles.placeholderNotice}>
              <p className={styles.placeholderText}>
                📝 Preview Mode: This is a placeholder training. Real trainings will be available once courses are created by administrators.
              </p>
            </div>
          )}
          {error && !isPlaceholder && (
            <p className={styles.errorMessage}>{error}</p>
          )}
          <Button
            variant="primary"
            className={styles.startButton}
            onClick={handleStartTraining}
            disabled={isLoading || isPlaceholder}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className={styles.spinner} />
                Loading...
              </>
            ) : isPlaceholder ? (
              <>
                <Play size={18} />
                Preview Only
              </>
            ) : (
              <>
                <Play size={18} />
                Start Training
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

