"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import styles from "./ContinueAsCard.module.css";

interface RememberedUser {
  email: string;
  name: string;
  avatar: string | null;
}

interface ContinueAsCardProps {
  user: RememberedUser;
  onContinue: (email: string) => void;
  onDismiss?: () => void;
}

export const ContinueAsCard: React.FC<ContinueAsCardProps> = ({
  user,
  onContinue,
  onDismiss,
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div className={styles.avatarSection}>
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className={styles.avatar}
              onError={(e) => {
                // Fallback to placeholder on error
                e.currentTarget.style.display = "none";
                const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                if (placeholder) {
                  placeholder.style.display = "flex";
                }
              }}
            />
          ) : null}
          <div
            className={styles.avatarPlaceholder}
            style={{ display: user.avatar ? "none" : "flex" }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className={styles.userInfo}>
          <p className={styles.welcomeText}>Welcome back!</p>
          <p className={styles.userName}>{user.name}</p>
        </div>
      </div>
      <div className={styles.actions}>
        <Button
          variant="primary"
          size="md"
          onClick={() => onContinue(user.email)}
          className={styles.continueButton}
        >
          Continue as {user.name.split(" ")[0]}
        </Button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={styles.dismissButton}
            aria-label="Dismiss"
          >
            Use different account
          </button>
        )}
      </div>
    </div>
  );
};

