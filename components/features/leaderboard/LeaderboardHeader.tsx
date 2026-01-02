"use client";

import React from "react";
import { 
  User, 
  Building2, 
  MapPin, 
  Globe2, 
  Calendar, 
  CalendarDays, 
  CalendarRange,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LeaderboardView, LeaderboardPeriod } from "@/types/leaderboard";
import { UserRole } from "@prisma/client";
import styles from "./LeaderboardHeader.module.css";

interface LeaderboardHeaderProps {
  view: LeaderboardView;
  period: LeaderboardPeriod;
  onViewChange: (view: LeaderboardView) => void;
  onPeriodChange: (period: LeaderboardPeriod) => void;
  userRole: UserRole;
}

export const LeaderboardHeader: React.FC<LeaderboardHeaderProps> = ({
  view,
  period,
  onViewChange,
  onPeriodChange,
  userRole,
}) => {
  // Customize views based on role
  // Employees: See Branch/Area/Regional views (filtered by their location)
  // Trainers/Admins: See "All Employees" view (no filtering)
  const isTrainerOrAdmin = userRole === UserRole.TRAINER || userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
  
  const views: { value: LeaderboardView; label: string; icon: LucideIcon }[] = isTrainerOrAdmin
    ? [
        // Trainers/Admins: Only show "All Employees" view
        { value: "INDIVIDUAL", label: "All Employees", icon: Users },
      ]
    : [
        // Employees: Show Branch/Area/Regional views
        { value: "BRANCH", label: "Branch", icon: Building2 },
        { value: "AREA", label: "Area", icon: MapPin },
        { value: "REGIONAL", label: "Regional", icon: Globe2 },
        { value: "INDIVIDUAL", label: "All", icon: User },
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

