"use client";

import React from "react";
import { X, Trophy, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./PerfectScoreModal.module.css";

interface PerfectScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  highestScore: number;
}

export const PerfectScoreModal: React.FC<PerfectScoreModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  highestScore,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={24} />
        </button>

        <div className={styles.content}>
          <div className={styles.iconContainer}>
            <Trophy size={48} className={styles.trophyIcon} />
          </div>

          <h2 className={styles.title}>You Already Have a Perfect Score!</h2>

          <div className={styles.messageContainer}>
            <p className={styles.message}>
              Congratulations! You've already achieved a perfect score of{" "}
              <span className={styles.scoreHighlight}>{highestScore}%</span> on this quiz.
            </p>
            <p className={styles.warning}>
              You can take a refresher quiz to practice, but your new score will{" "}
              <strong>not be recorded</strong> since you've already achieved the highest possible score.
            </p>
            <p className={styles.encouragement}>
              This is a great opportunity to reinforce your learning without the pressure of scoring!
            </p>
          </div>

          <div className={styles.actions}>
            <Button
              variant="outline"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={onConfirm}
              className={styles.confirmButton}
            >
              Take Refresher Quiz
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

