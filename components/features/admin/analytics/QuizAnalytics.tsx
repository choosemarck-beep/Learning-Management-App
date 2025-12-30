"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatsCard } from "../StatsCard";
import { AnalyticsChart } from "./AnalyticsChart";
import { DateRangePicker } from "./DateRangePicker";
import { FileQuestion, CheckCircle, XCircle, Clock } from "lucide-react";
import styles from "./QuizAnalytics.module.css";

interface QuizAnalyticsData {
  totalQuizAttempts: number;
  quizAttempts: number;
  miniQuizAttempts: number;
  averageScore: number;
  quizAverageScore: number;
  miniQuizAverageScore: number;
  passRate: number;
  failRate: number;
  retakeRate: number;
  averageTimeSpent: number;
  quizPerformance: Array<{
    quizId: string;
    title: string;
    passingScore: number;
    totalAttempts: number;
    passed: number;
    failed: number;
    passRate: number;
    averageScore: number;
  }>;
  mostDifficultQuizzes: Array<{
    quizId: string;
    title: string;
    passingScore: number;
    averageScore: number;
    totalAttempts: number;
    passRate: number;
  }>;
  scoreDistribution: {
    "0-50%": number;
    "50-70%": number;
    "70-85%": number;
    "85-100%": number;
  };
}

export const QuizAnalytics: React.FC = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<QuizAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/analytics/quizzes?days=${days}`);
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Error fetching quiz analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  if (loading || !data) {
    return (
      <Card className={styles.card}>
        <CardBody>
          <div className={styles.loading}>Loading quiz analytics...</div>
        </CardBody>
      </Card>
    );
  }

  const scoreDistributionData = Object.entries(data.scoreDistribution).map(([key, value]) => ({
    name: key,
    value,
  }));

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle className={styles.title}>
          <FileQuestion size={20} /> Quiz & Assessment Analytics
        </CardTitle>
        <DateRangePicker days={days} onChange={setDays} />
      </CardHeader>
      <CardBody>
        <div className={styles.statsGrid}>
          <StatsCard
            label="Total Attempts"
            value={data.totalQuizAttempts}
            icon={<FileQuestion size={18} />}
          />
          <StatsCard
            label="Average Score"
            value={`${data.averageScore}%`}
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
      </CardBody>
    </Card>
  );
};

