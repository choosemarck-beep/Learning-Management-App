import React from "react";
import { cn } from "@/lib/utils/cn";
import styles from "./ProgressBar.module.css";

export interface ProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  showPercentage?: boolean;
  label?: string;
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, showPercentage = false, label, className, ...props }, ref) => {
    const clampedValue = Math.min(Math.max(value, 0), 100);

    return (
      <div ref={ref} className={cn(styles.wrapper, className)} {...props}>
        {(label || showPercentage) && (
          <div className={styles.header}>
            {label && <span className={styles.label}>{label}</span>}
            {showPercentage && (
              <span className={styles.percentage}>{Math.round(clampedValue)}%</span>
            )}
          </div>
        )}
        <div className={styles.bar} role="progressbar" aria-valuenow={clampedValue} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={styles.fill}
            style={{ width: `${clampedValue}%` }}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

