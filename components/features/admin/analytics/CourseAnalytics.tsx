"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatsCard } from "../StatsCard";
import { AnalyticsChart } from "./AnalyticsChart";
import { DateRangePicker } from "./DateRangePicker";
import { BookOpen, FileText, TrendingUp, Users } from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "./CourseAnalytics.module.css";

interface CourseAnalyticsData {
  totalCourses: number;
  publishedCourses: number;
  unpublishedCourses: number;
  totalTrainings: number;
  publishedTrainings: number;
  unpublishedTrainings: number;
  mostPopularCourses: Array<{
    courseId: string;
    title: string;
    isPublished: boolean;
    totalXP: number;
    enrollments: number;
    completions: number;
    completionRate: number;
  }>;
  leastPopularCourses: Array<{
    courseId: string;
    title: string;
    isPublished: boolean;
    totalXP: number;
    enrollments: number;
    completions: number;
    completionRate: number;
  }>;
  mostPopularTrainings: Array<{
    trainingId: string;
    title: string;
    isPublished: boolean;
    totalXP: number;
    enrollments: number;
    completions: number;
    completionRate: number;
  }>;
  coursesByCreator: Array<{
    creatorId: string;
    creatorName: string;
    coursesCreated: number;
  }>;
  creationTrend: Array<{
    date: string;
    courses: number;
    trainings: number;
  }>;
}

export const CourseAnalytics: React.FC = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<CourseAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/analytics/courses?days=${days}`);
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Error fetching course analytics:", error);
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
          <div className={styles.loading}>Loading course analytics...</div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle className={styles.title}>
          <BookOpen size={20} /> Course & Training Performance Analytics
        </CardTitle>
        <DateRangePicker days={days} onChange={setDays} />
      </CardHeader>
      <CardBody>
        <div className={styles.statsGrid}>
          <StatsCard
            label="Total Courses"
            value={data.totalCourses}
            icon={<BookOpen size={18} />}
          />
          <StatsCard
            label="Published Courses"
            value={data.publishedCourses}
            icon={<FileText size={18} />}
          />
          <StatsCard
            label="Total Trainings"
            value={data.totalTrainings}
            icon={<TrendingUp size={18} />}
          />
          <StatsCard
            label="Published Trainings"
            value={data.publishedTrainings}
            icon={<Users size={18} />}
          />
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Content Creation Trend</h3>
            <div style={{ width: "100%", height: "250px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.creationTrend.map(item => ({
                    date: item.date,
                    courses: item.courses,
                    trainings: item.trainings,
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.2)" />
                  <XAxis
                    dataKey="date"
                    stroke="var(--color-text-secondary)"
                    style={{ fontSize: "var(--font-size-xs)" }}
                  />
                  <YAxis
                    stroke="var(--color-text-secondary)"
                    style={{ fontSize: "var(--font-size-xs)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(139, 92, 246, 0.3)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="courses"
                    stroke="var(--color-primary-purple)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-primary-purple)", r: 4 }}
                    name="Courses"
                  />
                  <Line
                    type="monotone"
                    dataKey="trainings"
                    stroke="var(--color-accent-cyan)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-accent-cyan)", r: 4 }}
                    name="Trainings"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Most Popular Courses</h3>
            <AnalyticsChart
              type="bar"
              data={data.mostPopularCourses.slice(0, 10).map(course => ({
                name: course.title.length > 30
                  ? course.title.substring(0, 30) + "..."
                  : course.title,
                value: course.enrollments,
              }))}
              dataKey="value"
              xKey="name"
              yKey="value"
              name="Enrollments"
              height={250}
            />
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Courses by Creator</h3>
            <AnalyticsChart
              type="bar"
              data={data.coursesByCreator.slice(0, 10).map(creator => ({
                name: creator.creatorName,
                value: creator.coursesCreated,
              }))}
              dataKey="value"
              xKey="name"
              yKey="value"
              name="Courses Created"
              height={250}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

