import React from "react";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import styles from "./ProfileStatsTab.module.css";

export interface ProfileStatsTabProps {
  level: number;
  xp: number;
  rank: string;
  streak: number;
  diamonds: number;
  progressToNextLevel: number;
  isViewingOwnProfile?: boolean;
}

export const ProfileStatsTab: React.FC<ProfileStatsTabProps> = ({
  level,
  xp,
  rank,
  streak,
  diamonds,
  progressToNextLevel,
  isViewingOwnProfile = false,
}) => {
  return (
    <div className={styles.container}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Level</span>
            <span className={styles.statValue}>{level}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>XP</span>
            <span className={styles.statValue}>{xp}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Rank</span>
            <Badge variant="default">{rank}</Badge>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Streak</span>
            <span className={styles.statValue}>{streak} days</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Energy Crystals</span>
            <span className={styles.statValue}>{diamonds}</span>
          </div>
        </div>
        <div className={styles.progressSection}>
          <ProgressBar
            value={progressToNextLevel}
            showPercentage
            label="Progress to Next Level"
            />
          </div>
    </div>
  );
};

