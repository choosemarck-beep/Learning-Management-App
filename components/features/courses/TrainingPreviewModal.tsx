"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./TrainingPreviewModal.module.css";

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

interface TrainingPreviewModalProps {
  module: Module;
  course: Course;
  onClose: () => void;
}

export const TrainingPreviewModal: React.FC<TrainingPreviewModalProps> = ({
  module,
  course,
  onClose,
}) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Check if this is a placeholder module (not a real database record)
  const isPlaceholder = module.id.startsWith("module-") || module.id.startsWith("placeholder-");

  const handleStartTraining = async () => {
    // Don't allow starting placeholder trainings
    if (isPlaceholder) {
      setError("This is a preview training. Real trainings will be available once courses are created by administrators.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch first lesson in the module
      const response = await fetch(`/api/modules/${module.id}/lessons`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to fetch lessons";
        
        if (response.status === 404) {
          throw new Error("Training not found. This training may have been removed.");
        } else if (response.status === 403) {
          throw new Error("This training is not yet available.");
        } else {
          throw new Error(errorMessage);
        }
      }

      const data = await response.json();
      
      if (!data.success || !data.data.lessons || data.data.lessons.length === 0) {
        throw new Error("No lessons available in this training yet. Please check back later.");
      }

      // Get first lesson (ordered by order field)
      const firstLesson = data.data.lessons[0];
      
      // Navigate to lesson video page
      router.push(`/training/${module.id}/${firstLesson.id}`);
      onClose();
    } catch (err) {
      console.error("Error starting training:", err);
      setError(err instanceof Error ? err.message : "Failed to start training");
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      >
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, type: "spring", damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close preview"
          >
            <X size={24} />
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
              {error && (
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
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

