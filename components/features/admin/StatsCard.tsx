import React from "react";
import { Card, CardBody } from "@/components/ui/Card";
import styles from "./StatsCard.module.css";

interface StatsCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon,
  trend,
  className,
}) => {
  return (
    <Card className={`${styles.statsCard} ${className || ""}`}>
      <CardBody>
        <div className={styles.content}>
          {icon && <div className={styles.icon}>{icon}</div>}
          <div className={styles.stats}>
            <span className={styles.label}>{label}</span>
            <span className={styles.value}>{value.toLocaleString()}</span>
            {trend && (
              <span
                className={`${styles.trend} ${
                  trend.isPositive ? styles.trendPositive : styles.trendNegative
                }`}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

