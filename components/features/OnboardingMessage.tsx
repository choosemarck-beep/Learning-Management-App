"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import styles from "./OnboardingMessage.module.css";

export interface OnboardingMessageProps {
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const OnboardingMessage: React.FC<OnboardingMessageProps> = ({
  userName,
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/employee/onboarding/complete", {
        method: "POST",
      });

      if (response.ok) {
        onClose();
        router.refresh();
      } else {
        // Handle API errors
        const data = await response.json().catch(() => ({}));
        const errorMessage = data.error || "Failed to complete onboarding. Please try again.";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      closeOnBackdropClick={false}
      className={`${styles.modal} onboardingModal`}
    >
      <div className={styles.content}>
        <div className={styles.centeredContent}>
          <p className={styles.greeting}>Welcome, {userName}!</p>

          <div className={styles.messageSection}>
            <p className={styles.message}>
              Welcome to Learning Management App! We're excited to have you on board.
              Your learning journey starts here.
            </p>
            <p className={styles.message}>
              Complete your profile, explore courses, and start earning XP as you
              progress through your learning path.
            </p>
          </div>

          <div className={styles.actions}>
            <Button
              variant="primary"
              size="lg"
              onClick={handleGetStarted}
              isLoading={isLoading}
              className={styles.button}
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
