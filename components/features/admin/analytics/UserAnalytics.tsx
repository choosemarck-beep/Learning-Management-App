"use client";

import React, { useState, useEffect } from "react";
import { StatsCard } from "../StatsCard";
import { AnalyticsChart } from "./AnalyticsChart";
import { DateRangePicker } from "./DateRangePicker";
import { Users, UserPlus, TrendingUp, AlertCircle } from "lucide-react";
import styles from "./UserAnalytics.module.css";

interface UserAnalyticsData {
  totalActiveUsers: number;
  newUsers: number;
  activeLearners: number;
  inactiveUsers: {
    last30Days: number;
    last60Days: number;
    last90Days: number;
  };
  usersByRole: Array<{ role: string; count: number }>;
  usersByBranch: Array<{ branch: string; count: number }>;
  userGrowth: Array<{ date: string; count: number }>;
}

export const UserAnalytics: React.FC = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<UserAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/analytics/users?days=${days}`);
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Error fetching user analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  if (loading || !data) {
    return (
      <div className={styles.loading}>Loading user analytics...</div>
    );
  }

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <DateRangePicker days={days} onChange={setDays} />
      </div>
      <div className={styles.body}>
        <div className={styles.statsGrid}>
          <StatsCard
            label="Total Active Users"
            value={data.totalActiveUsers}
            icon={<Users size={18} />}
          />
          <StatsCard
            label="New Users"
            value={data.newUsers}
            icon={<UserPlus size={18} />}
          />
          <StatsCard
            label="Active Learners"
            value={data.activeLearners}
            icon={<TrendingUp size={18} />}
          />
          <StatsCard
            label="Inactive (30 days)"
            value={data.inactiveUsers.last30Days}
            icon={<AlertCircle size={18} />}
          />
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>User Growth</h3>
            <AnalyticsChart
              type="line"
              data={data.userGrowth}
              dataKey="count"
              xKey="date"
              yKey="count"
              name="Users"
              height={250}
            />
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Users by Role</h3>
            <AnalyticsChart
              type="bar"
              data={data.usersByRole.map(item => ({
                name: item.role.replace(/_/g, " "),
                value: item.count,
              }))}
              dataKey="value"
              xKey="name"
              yKey="value"
              name="Users"
              height={250}
            />
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Users by Branch</h3>
            <AnalyticsChart
              type="bar"
              data={data.usersByBranch.slice(0, 10).map(item => ({
                name: item.branch,
                value: item.count,
              }))}
              dataKey="value"
              xKey="name"
              yKey="value"
              name="Users"
              height={250}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

