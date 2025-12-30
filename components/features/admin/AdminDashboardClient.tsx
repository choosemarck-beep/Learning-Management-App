"use client";

import React, { useState, useEffect } from "react";
import { StatsCard } from "./StatsCard";
import styles from "./AdminDashboardClient.module.css";

interface AdminDashboardClientProps {
  initialStats: {
    totalUsers: number;
    rejectedUsers: number;
    pendingUsers: number;
  };
  onStatsUpdate?: () => void;
}

export const AdminDashboardClient: React.FC<AdminDashboardClientProps> = ({
  initialStats,
  onStatsUpdate,
}) => {
  const [stats, setStats] = useState(initialStats);

  // Fetch updated stats when onStatsUpdate is called
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/users?status=ALL&limit=1");
        const data = await response.json();
        
        if (data.success) {
          // Fetch counts from API
          const [totalResponse, pendingResponse, rejectedResponse] = await Promise.all([
            fetch("/api/admin/users?status=ALL"),
            fetch("/api/admin/users?status=PENDING"),
            fetch("/api/admin/users?status=REJECTED"),
          ]);
          
          const [totalData, pendingData, rejectedData] = await Promise.all([
            totalResponse.json(),
            pendingResponse.json(),
            rejectedResponse.json(),
          ]);
          
          setStats({
            totalUsers: totalData.data?.length || 0,
            pendingUsers: pendingData.data?.length || 0,
            rejectedUsers: rejectedData.data?.length || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    if (onStatsUpdate) {
      // Set up a way to trigger stats refresh
      // This will be called from parent when needed
    }
  }, [onStatsUpdate]);

  // Refresh stats when initialStats change (from parent)
  useEffect(() => {
    setStats(initialStats);
  }, [initialStats]);

  return (
    <div className={styles.container}>
      {/* Analytics Stats Grid */}
      <div className={styles.statsGrid}>
        <StatsCard
          label="Total Users"
          value={stats.totalUsers}
        />
        <StatsCard
          label="Pending"
          value={stats.pendingUsers}
        />
        <StatsCard
          label="Rejected"
          value={stats.rejectedUsers}
        />
      </div>

      {/* Additional Analytics Widgets can be added here */}
      {/* Charts, graphs, metrics, etc. */}
    </div>
  );
};

