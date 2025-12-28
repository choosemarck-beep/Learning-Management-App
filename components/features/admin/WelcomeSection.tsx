import React from "react";
import { Card, CardBody } from "@/components/ui/Card";
import styles from "./WelcomeSection.module.css";

interface WelcomeSectionProps {
  userName: string;
  pendingCount: number;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  userName,
  pendingCount,
}) => {
  return (
    <Card className={styles.welcomeCard}>
      <CardBody>
        <div className={styles.content}>
          <div className={styles.text}>
            <h1 className={styles.greeting}>Hello {userName}!</h1>
            <p className={styles.message}>
              {pendingCount > 0
                ? `You have ${pendingCount} pending user${pendingCount > 1 ? "s" : ""} awaiting approval. Let's review them!`
                : "All caught up! No pending approvals at this time."}
            </p>
            {pendingCount > 0 && (
              <a href="#pending-users" className={styles.link}>
                Review pending users →
              </a>
            )}
          </div>
          <div className={styles.illustration}>
            <div className={styles.illustrationPlaceholder}>
              <svg
                width="200"
                height="200"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  stroke="url(#gradient1)"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.3"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="50"
                  stroke="url(#gradient2)"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.5"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="20"
                  fill="url(#gradient3)"
                />
                <defs>
                  <linearGradient id="gradient1" x1="20" y1="20" x2="180" y2="180">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                  <linearGradient id="gradient2" x1="50" y1="50" x2="150" y2="150">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#0EA5E9" />
                  </linearGradient>
                  <linearGradient id="gradient3" x1="80" y1="80" x2="120" y2="120">
                    <stop offset="0%" stopColor="#FBBF24" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

