"use client";

import React from "react";
import { LeaderboardView, LeaderboardPeriod } from "@/types/leaderboard";
import styles from "./LeaderboardHeader.module.css";

interface LeaderboardHeaderProps {
  view: LeaderboardView;
  period: LeaderboardPeriod;
  onViewChange: (view: LeaderboardView) => void;
  onPeriodChange: (period: LeaderboardPeriod) => void;
}

export const LeaderboardHeader: React.FC<LeaderboardHeaderProps> = ({
  view,
  period,
  onViewChange,
  onPeriodChange,
}) => {
  const views: { value: LeaderboardView; label: string }[] = [
    { value: "INDIVIDUAL", label: "Individual" },
    { value: "BRANCH", label: "Branch" },
    { value: "AREA", label: "Area" },
    { value: "REGIONAL", label: "Regional" },
  ];

  const periods: { value: LeaderboardPeriod; label: string }[] = [
    { value: "DAILY", label: "Daily" },
    { value: "WEEKLY", label: "Weekly" },
    { value: "MONTHLY", label: "Monthly" },
    { value: "YEARLY", label: "Yearly" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.viewSelector}>
        <label className={styles.label}>View:</label>
        <div className={styles.tabs}>
          {views.map((v) => (
            <button
              key={v.value}
              className={`${styles.tab} ${view === v.value ? styles.active : ""}`}
              onClick={() => onViewChange(v.value)}
              aria-label={`View ${v.label} leaderboard`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.periodSelector}>
        <label className={styles.label}>Period:</label>
        <div className={styles.tabs}>
          {periods.map((p) => (
            <button
              key={p.value}
              className={`${styles.tab} ${period === p.value ? styles.active : ""}`}
              onClick={() => onPeriodChange(p.value)}
              aria-label={`View ${p.label} leaderboard`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

