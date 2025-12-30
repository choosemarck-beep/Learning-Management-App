"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { Trophy, Medal, Award, Flame, Gem } from "lucide-react";
import { LeaderboardEntry as LeaderboardEntryType } from "@/types/leaderboard";
import { getLevelProgress } from "@/lib/utils/gamification";
import styles from "./LeaderboardEntry.module.css";

interface LeaderboardEntryProps {
  user: LeaderboardEntryType;
  rank: number;
  isCurrentUser: boolean;
  highlight: boolean;
}

export const LeaderboardEntry: React.FC<LeaderboardEntryProps> = ({
  user,
  rank,
  isCurrentUser,
  highlight,
}) => {
  const { data: session } = useSession();
  
  // Use session avatar for current user, otherwise use user avatar
  const avatar = isCurrentUser && session?.user?.avatar 
    ? session.user.avatar 
    : user.avatar;

  const levelProgress = getLevelProgress(user.xp);

  // Medal icons for top 3
  const getRankIcon = () => {
    if (rank === 1) {
      return <Trophy size={24} className={styles.goldMedal} />;
    } else if (rank === 2) {
      return <Medal size={24} className={styles.silverMedal} />;
    } else if (rank === 3) {
      return <Award size={24} className={styles.bronzeMedal} />;
    }
    return null;
  };

  return (
    <div className={`${styles.entry} ${highlight ? styles.highlight : ""} ${isCurrentUser ? styles.currentUser : ""}`}>
      <div className={styles.rankBadge}>
        {getRankIcon() || <span className={styles.rankNumber}>#{rank}</span>}
      </div>

      <div className={styles.avatarContainer}>
        {avatar ? (
          <img src={avatar} alt={user.name} className={styles.avatar} />
        ) : (
          <div className={styles.avatarPlaceholder}>
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className={styles.userInfo}>
        <div className={styles.nameRow}>
          <h3 className={styles.name}>{user.name}</h3>
          {user.employeeNumber && (
            <span className={styles.employeeNumber}>#{user.employeeNumber}</span>
          )}
        </div>
        <div className={styles.rankName}>{user.rankName}</div>
        <div className={styles.metrics}>
          <span className={styles.metric}>
            <span className={styles.metricLabel}>XP:</span>
            <span className={styles.metricValue}>{user.xp.toLocaleString()}</span>
          </span>
          <span className={styles.metric}>
            <span className={styles.metricLabel}>Level:</span>
            <span className={styles.metricValue}>{user.level}</span>
          </span>
          <span className={styles.metric}>
            <span className={styles.metricLabel}>Streak:</span>
            <span className={styles.metricValue}>
              {user.streak} <Flame size={14} className={styles.inlineIcon} />
            </span>
          </span>
          <span className={styles.metric}>
            <span className={styles.metricLabel}>Diamonds:</span>
            <span className={styles.metricValue}>
              {user.diamonds} <Gem size={14} className={styles.inlineIcon} />
            </span>
          </span>
        </div>
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <span className={styles.progressText}>{Math.round(levelProgress)}% to next level</span>
        </div>
      </div>
    </div>
  );
};

