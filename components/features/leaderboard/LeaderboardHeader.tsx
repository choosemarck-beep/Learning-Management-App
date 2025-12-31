"use client";

import React from "react";
import { 
  User, 
  Building2, 
  MapPin, 
  Globe2, 
  Calendar, 
  CalendarDays, 
  CalendarRange 
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
  const views: { value: LeaderboardView; label: string; icon: LucideIcon }[] = [
    { value: "INDIVIDUAL", label: "Individual", icon: User },
    { value: "BRANCH", label: "Branch", icon: Building2 },
    { value: "AREA", label: "Area", icon: MapPin },
    { value: "REGIONAL", label: "Regional", icon: Globe2 },
  ];

  const periods: { value: LeaderboardPeriod; label: string; icon: LucideIcon }[] = [
    { value: "DAILY", label: "Daily", icon: Calendar },
    { value: "WEEKLY", label: "Weekly", icon: CalendarDays },
    { value: "MONTHLY", label: "Monthly", icon: Calendar }, // Using Calendar for Monthly (CalendarMonth doesn't exist)
    { value: "YEARLY", label: "Yearly", icon: CalendarRange },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.viewSelector}>
        <div className={styles.tabs}>
          {views.map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.value}
                className={`${styles.tab} ${view === v.value ? styles.active : ""}`}
                onClick={() => onViewChange(v.value)}
                aria-label={`View ${v.label} leaderboard`}
              >
                <Icon size={20} className={styles.icon} />
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.periodSelector}>
        <div className={styles.tabs}>
          {periods.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.value}
                className={`${styles.tab} ${period === p.value ? styles.active : ""}`}
                onClick={() => onPeriodChange(p.value)}
                aria-label={`View ${p.label} leaderboard`}
              >
                <Icon size={20} className={styles.icon} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

