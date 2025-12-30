"use client";

import React, { useState, useEffect } from "react";
import { StatsCard } from "../../admin/StatsCard";
import { AnalyticsChart } from "../../admin/analytics/AnalyticsChart";
import { DateRangePicker } from "../../admin/analytics/DateRangePicker";
import { FileQuestion, CheckCircle, XCircle, Clock } from "lucide-react";
import styles from "./TrainerQuizAnalytics.module.css";

interface TrainerQuizAnalyticsData {
  totalQuizAttempts: number;
  totalMiniQuizAttempts: number;
  totalAttempts: number;
  averageScore: number;
  averageMiniQuizScore: number;
  overallAverageScore: number;
  passRate: number;
  failRate: number;
  retakeRate: number;
  averageTimeSpent: number;
  quizPerformance: Array<{
    quizId: string;
    title: string;
    averageScore: number;
    totalAttempts: number;
  }>;
  mostDifficultQuizzes: Array<{
    quizId: string;
    title: string;
    averageScore: number;
    totalAttempts: number;
  }>;
  scoreDistribution: {
    "0-50%": number;
    "50-70%": number;
    "70-85%": number;
    "85-100%": number;
  };
}

export const TrainerQuizAnalytics: React.FC = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<TrainerQuizAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/trainer/analytics/quizzes?days=${days}`);
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Error fetching trainer quiz analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  if (loading || !data) {
    return (
      <div className={styles.loading}>Loading quiz analytics...</div>
    );
  }

  const scoreDistributionData = Object.entries(data.scoreDistribution).map(([key, value]) => ({
    name: key,
    value,
  }));

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <DateRangePicker days={days} onChange={setDays} />
      </div>
      <div className={styles.body}>
        <div className={styles.statsGrid}>
          <StatsCard
            label="Total Attempts"
            value={data.totalAttempts}
            icon={<FileQuestion size={18} />}
          />
          <StatsCard
            label="Average Score"
            value={`${data.overallAverageScore}%`}
            icon={<CheckCircle size={18} />}
          />
          <StatsCard
            label="Pass Rate"
            value={`${data.passRate}%`}
            icon={<CheckCircle size={18} />}
          />
          <StatsCard
            label="Fail Rate"
            value={`${data.failRate}%`}
            icon={<XCircle size={18} />}
          />
          <StatsCard
            label="Retake Rate"
            value={`${data.retakeRate}%`}
            icon={<Clock size={18} />}
          />
          <StatsCard
            label="Avg Time Spent"
            value={`${Math.round(data.averageTimeSpent / 60)}m`}
            icon={<Clock size={18} />}
          />
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Score Distribution</h3>
            <AnalyticsChart
              type="bar"
              data={scoreDistributionData}
              dataKey="value"
              xKey="name"
              yKey="value"
              name="Attempts"
              height={250}
            />
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Quiz Performance</h3>
            <AnalyticsChart
              type="bar"
              data={data.quizPerformance.slice(0, 10).map(quiz => ({
                name: quiz.title.length > 30
                  ? quiz.title.substring(0, 30) + "..."
                  : quiz.title,
                value: quiz.averageScore,
              }))}
              dataKey="value"
              xKey="name"
              yKey="value"
              name="Average Score %"
              height={250}
            />
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Most Difficult Quizzes</h3>
            <AnalyticsChart
              type="bar"
              data={data.mostDifficultQuizzes.slice(0, 10).map(quiz => ({
                name: quiz.title.length > 30
                  ? quiz.title.substring(0, 30) + "..."
                  : quiz.title,
                value: quiz.averageScore,
              }))}
              dataKey="value"
              xKey="name"
              yKey="value"
              name="Average Score %"
              height={250}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

