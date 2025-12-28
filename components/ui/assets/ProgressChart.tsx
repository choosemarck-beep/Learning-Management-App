import React from "react";
import { TrendingUp } from "lucide-react";
import styles from "./ProgressChart.module.css";

export interface ProgressChartProps {
  size?: number;
  className?: string;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  size = 48,
  className,
}) => {
  return (
    <div className={`${styles.chartWrapper} ${className || ""}`}>
      <TrendingUp
        size={size}
        className={styles.chartIcon}
        strokeWidth={2}
        aria-hidden="true"
      />
    </div>
  );
};

