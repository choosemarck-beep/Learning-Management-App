"use client";

import React, { useState, useEffect } from "react";
import { StatsCard } from "../../admin/StatsCard";
import { AnalyticsChart } from "../../admin/analytics/AnalyticsChart";
import { DateRangePicker } from "../../admin/analytics/DateRangePicker";
import { Activity, Users, TrendingUp, Clock } from "lucide-react";
import styles from "./TrainerEngagementAnalytics.module.css";

interface TrainerEngagementAnalyticsData {
  activeLearners: number;
  activeLearnersLastWeek: number;
  activeLearnersLastMonth: number;
  totalEnrollments: number;
  averageTimeToComplete: number;
  trainingPopularity: Array<{
    trainingId: string;
    trainingTitle: string;
    enrollments: number;
  }>;
  coursePopularity: Array<{
    courseId: string;
    courseTitle: string;
    enrollments: number;
  }>;
  mostEngagedLearners: Array<{
    userId: string;
    name: string;
    email: string;
    avatar: string | null;
    completions: number;
  }>;
  engagementTrend: Array<{
    date: string;
    completions: number;
  }>;
}

export const TrainerEngagementAnalytics: React.FC = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<TrainerEngagementAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/trainer/analytics/engagement?days=${days}`);
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Error fetching trainer engagement analytics:", error);
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

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <DateRangePicker days={days} onChange={setDays} />
      </div>
      <div className={styles.body}>
        <div className={styles.statsGrid}>
          <StatsCard
            label="Active Learners"
            value={data.activeLearners}
            icon={<Activity size={18} />}
          />
          <StatsCard
            label="Active (Last Week)"
            value={data.activeLearnersLastWeek}
            icon={<TrendingUp size={18} />}
          />
          <StatsCard
            label="Active (Last Month)"
            value={data.activeLearnersLastMonth}
            icon={<Users size={18} />}
          />
          <StatsCard
            label="Total Enrollments"
            value={data.totalEnrollments}
            icon={<Users size={18} />}
          />
          <StatsCard
            label="Avg Time to Complete"
            value={`${data.averageTimeToComplete}h`}
            icon={<Clock size={18} />}
          />
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Engagement Trend</h3>
            <AnalyticsChart
              type="line"
              data={data.engagementTrend}
              dataKey="completions"
              xKey="date"
              yKey="completions"
              name="Completions"
              height={250}
            />
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Training Popularity</h3>
            <AnalyticsChart
              type="bar"
              data={data.trainingPopularity.map(training => ({
                name: training.trainingTitle.length > 30
                  ? training.trainingTitle.substring(0, 30) + "..."
                  : training.trainingTitle,
                value: training.enrollments,
              }))}
              dataKey="value"
              xKey="name"
              yKey="value"
              name="Enrollments"
              height={250}
            />
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Course Popularity</h3>
            <AnalyticsChart
              type="bar"
              data={data.coursePopularity.map(course => ({
                name: course.courseTitle.length > 30
                  ? course.courseTitle.substring(0, 30) + "..."
                  : course.courseTitle,
                value: course.enrollments,
              }))}
              dataKey="value"
              xKey="name"
              yKey="value"
              name="Enrollments"
              height={250}
            />
          </div>
        </div>

        {data.mostEngagedLearners.length > 0 && (
          <div className={styles.learnersSection}>
            <h3 className={styles.sectionTitle}>Most Engaged Learners</h3>
            <div className={styles.learnersTable}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Completions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.mostEngagedLearners.map((learner) => (
                    <tr key={learner.userId}>
                      <td>{learner.name}</td>
                      <td>{learner.email}</td>
                      <td>{learner.completions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

