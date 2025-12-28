import React from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./ProgressIndicator.module.css";

export interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  className,
}) => {
  return (
    <div className={cn(styles.container, className)}>
      <div className={styles.steps}>
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={stepNumber} className={styles.stepWrapper}>
              <div
                className={cn(
                  styles.step,
                  isCompleted && styles.completed,
                  isCurrent && styles.current
                )}
              >
                {isCompleted ? (
                  <svg
                    className={styles.checkIcon}
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16.667 5L7.5 14.167 3.333 10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span className={styles.stepNumber}>{stepNumber}</span>
                )}
              </div>
              {stepNumber < totalSteps && (
                <div
                  className={cn(
                    styles.connector,
                    isCompleted && styles.connectorCompleted
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className={styles.label}>
        Step {currentStep} of {totalSteps}
      </div>
    </div>
  );
};

