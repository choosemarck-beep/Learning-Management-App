"use client";

import React from "react";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import styles from "./ApprovalProgressBar.module.css";

interface ApprovalProgressBarProps {
  areaManagerApproved: boolean;
  regionalManagerApproved: boolean;
  adminApproved: boolean;
  isRejected: boolean;
  hasRegionalManager: boolean;
}

export const ApprovalProgressBar: React.FC<ApprovalProgressBarProps> = ({
  areaManagerApproved,
  regionalManagerApproved,
  adminApproved,
  isRejected,
  hasRegionalManager,
}) => {
  const steps = [
    {
      label: "Area Manager",
      completed: areaManagerApproved,
      isCurrent: !areaManagerApproved && !isRejected,
    },
    ...(hasRegionalManager
      ? [
          {
            label: "Regional Manager",
            completed: regionalManagerApproved,
            isCurrent:
              areaManagerApproved &&
              !regionalManagerApproved &&
              !adminApproved &&
              !isRejected,
          },
        ]
      : []),
    {
      label: "Admin",
      completed: adminApproved,
      isCurrent:
        areaManagerApproved &&
        (hasRegionalManager ? regionalManagerApproved : true) &&
        !adminApproved &&
        !isRejected,
    },
  ];

  const totalSteps = steps.length;
  const completedSteps = steps.filter((step) => step.completed).length;
  const progressPercentage = isRejected ? 0 : (completedSteps / totalSteps) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.progressBar}>
        <div
          className={`${styles.progressFill} ${isRejected ? styles.rejected : ""}`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className={styles.steps}>
        {steps.map((step, index) => (
          <div key={index} className={styles.step}>
            <div
              className={`${styles.stepIcon} ${
                step.completed
                  ? styles.completed
                  : step.isCurrent
                  ? styles.current
                  : isRejected
                  ? styles.rejected
                  : styles.pending
              }`}
            >
              {step.completed ? (
                <CheckCircle size={20} />
              ) : isRejected && index === 0 ? (
                <XCircle size={20} />
              ) : (
                <Clock size={20} />
              )}
            </div>
            <span
              className={`${styles.stepLabel} ${
                step.completed
                  ? styles.completed
                  : step.isCurrent
                  ? styles.current
                  : styles.pending
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.progressText}>
        {isRejected
          ? "Request Rejected"
          : completedSteps === totalSteps
          ? "Fully Approved"
          : `Step ${completedSteps + 1} of ${totalSteps}`}
      </div>
    </div>
  );
};

