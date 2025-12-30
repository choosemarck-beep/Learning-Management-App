"use client";

import React from "react";
import { LeaderboardEntry } from "./LeaderboardEntry";
import { LeaderboardResponse } from "@/types/leaderboard";
import styles from "./LeaderboardList.module.css";

interface LeaderboardListProps {
  topUsers: LeaderboardResponse["topUsers"];
  currentUserEntry: LeaderboardResponse["currentUserEntry"];
  currentUserRank: number;
  isLoading: boolean;
}

export const LeaderboardList: React.FC<LeaderboardListProps> = ({
  topUsers,
  currentUserEntry,
  currentUserRank,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading leaderboard...</div>
      </div>
    );
  }

  if (topUsers.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>No users found in this leaderboard.</div>
      </div>
    );
  }

  // Check if current user is in top users
  const isCurrentUserInTop = topUsers.some((user) => user.rank === currentUserRank);

  return (
    <div className={styles.container}>
      <div className={styles.topUsers}>
        {topUsers.map((user) => (
          <LeaderboardEntry
            key={user.userId}
            user={user}
            rank={user.rank}
            isCurrentUser={user.rank === currentUserRank}
            highlight={user.rank === currentUserRank}
          />
        ))}
      </div>

      {/* Show current user's rank if not in top 10 */}
      {!isCurrentUserInTop && currentUserEntry && (
        <>
          <div className={styles.separator}>
            <span className={styles.separatorText}>Your Rank</span>
          </div>
          <div className={styles.currentUserSection}>
            <LeaderboardEntry
              user={currentUserEntry}
              rank={currentUserRank}
              isCurrentUser={true}
              highlight={true}
            />
          </div>
        </>
      )}
    </div>
  );
};

