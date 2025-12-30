"use client";

import React, { useState, useEffect } from "react";
import { StatsCard } from "../../admin/StatsCard";
import { AnalyticsChart } from "../../admin/analytics/AnalyticsChart";
import { DateRangePicker } from "../../admin/analytics/DateRangePicker";
import { BookOpen, CheckCircle, TrendingUp, Users } from "lucide-react";
import styles from "./TrainerCompletionAnalytics.module.css";

interface TrainerCompletionAnalyticsData {
  totalTrainings: number;
  totalCourses: number;
  totalEnrollments: number;
  trainingCompletions: number;
  courseCompletions: number;
  totalCompletions: number;
  overallCompletionRate: number;
  completionRateByTraining: Array<{
    trainingId: string;
    trainingTitle: string;
    totalEnrollments: number;
    completions: number;
    completionRate: number;
  }>;
  completionRateByCourse: Array<{
    courseId: string;
    courseTitle: string;
    totalEnrollments: number;
    completions: number;
    completionRate: number;
  }>;
  completionTrends: Array<{
    date: string;
    trainingCompletions: number;
    courseCompletions: number;
    totalCompletions: number;
  }>;
}

export const TrainerCompletionAnalytics: React.FC = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<TrainerCompletionAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/trainer/analytics/completion?days=${days}`);
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Error fetching trainer completion analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  if (loading || !data) {
    return (
      <div className={styles.loading}>Loading completion analytics...</div>
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
            label="Total Trainings"
            value={data.totalTrainings}
            icon={<BookOpen size={18} />}
          />
          <StatsCard
            label="Total Courses"
            value={data.totalCourses}
            icon={<BookOpen size={18} />}
          />
          <StatsCard
            label="Total Enrollments"
            value={data.totalEnrollments}
            icon={<Users size={18} />}
          />
          <StatsCard
            label="Completion Rate"
            value={`${data.overallCompletionRate}%`}
            icon={<CheckCircle size={18} />}
          />
          <StatsCard
            label="Training Completions"
            value={data.trainingCompletions}
            icon={<TrendingUp size={18} />}
          />
          <StatsCard
            label="Course Completions"
            value={data.courseCompletions}
            icon={<TrendingUp size={18} />}
          />
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Completion Trends</h3>
            <AnalyticsChart
              type="line"
              data={data.completionTrends}
              dataKey="totalCompletions"
              xKey="date"
              yKey="totalCompletions"
              name="Completions"
              height={250}
            />
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Top Trainings by Completion Rate</h3>
            <AnalyticsChart
              type="bar"
              data={data.completionRateByTraining.slice(0, 10).map(training => ({
                name: training.trainingTitle.length > 30
                  ? training.trainingTitle.substring(0, 30) + "..."
                  : training.trainingTitle,
                value: training.completionRate,
              }))}
              dataKey="value"
              xKey="name"
              yKey="value"
              name="Completion Rate %"
              height={250}
            />
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Top Courses by Completion Rate</h3>
            <AnalyticsChart
              type="bar"
              data={data.completionRateByCourse.slice(0, 10).map(course => ({
                name: course.courseTitle.length > 30
                  ? course.courseTitle.substring(0, 30) + "..."
                  : course.courseTitle,
                value: course.completionRate,
              }))}
              dataKey="value"
              xKey="name"
              yKey="value"
              name="Completion Rate %"
              height={250}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

