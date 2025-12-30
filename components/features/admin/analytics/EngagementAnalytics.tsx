"use client";

import React, { useState, useEffect } from "react";
import { StatsCard } from "../StatsCard";
import { AnalyticsChart } from "./AnalyticsChart";
import { DateRangePicker } from "./DateRangePicker";
import { Activity, Clock, Video, TrendingUp } from "lucide-react";
import styles from "./EngagementAnalytics.module.css";

interface EngagementAnalyticsData {
  dau: number;
  wau: number;
  mau: number;
  averageSessionDuration: number;
  totalVideoWatchTime: number;
  averageVideoWatchTime: number;
  totalLearningTime: number;
  activityByHour: Array<{ hour: number; count: number }>;
  activityByDay: Array<{ day: string; dayIndex: number; count: number }>;
  activityTrend: Array<{ date: string; count: number }>;
}

export const EngagementAnalytics: React.FC = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<EngagementAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/analytics/engagement?days=${days}`);
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Error fetching engagement analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  if (loading || !data) {
    return (
      <div className={styles.loading}>Loading engagement analytics...</div>
    );
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <DateRangePicker days={days} onChange={setDays} />
      </div>
      <div className={styles.body}>
        <div className={styles.statsGrid}>
          <StatsCard
            label="Daily Active Users"
            value={data.dau}
            icon={<Activity size={18} />}
          />
          <StatsCard
            label="Weekly Active Users"
            value={data.wau}
            icon={<TrendingUp size={18} />}
          />
          <StatsCard
            label="Monthly Active Users"
            value={data.mau}
            icon={<Activity size={18} />}
          />
          <StatsCard
            label="Avg Session Duration"
            value={`${data.averageSessionDuration}m`}
            icon={<Clock size={18} />}
          />
          <StatsCard
            label="Total Video Watch Time"
            value={formatTime(data.totalVideoWatchTime)}
            icon={<Video size={18} />}
          />
          <StatsCard
            label="Total Learning Time"
            value={formatTime(data.totalLearningTime)}
            icon={<Clock size={18} />}
          />
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Activity Trend</h3>
            <AnalyticsChart
              type="line"
              data={data.activityTrend}
              dataKey="count"
              xKey="date"
              yKey="count"
              name="Activities"
              height={250}
            />
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Activity by Hour</h3>
            <AnalyticsChart
              type="bar"
              data={data.activityByHour.map(item => ({
                name: `${item.hour}:00`,
                value: item.count,
              }))}
              dataKey="value"
              xKey="name"
              yKey="value"
              name="Activities"
              height={250}
            />
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Activity by Day of Week</h3>
            <AnalyticsChart
              type="bar"
              data={data.activityByDay.map(item => ({
                name: item.day,
                value: item.count,
              }))}
              dataKey="value"
              xKey="name"
              yKey="value"
              name="Activities"
              height={250}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

