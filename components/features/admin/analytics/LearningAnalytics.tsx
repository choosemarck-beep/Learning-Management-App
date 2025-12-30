"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatsCard } from "../StatsCard";
import { AnalyticsChart } from "./AnalyticsChart";
import { DateRangePicker } from "./DateRangePicker";
import { BookOpen, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";
import styles from "./LearningAnalytics.module.css";

interface LearningAnalyticsData {
  overallCompletionRate: number;
  averageProgress: number;
  totalCompletions: number;
  courseCompletions: number;
  trainingCompletions: number;
  completionRateByCourse: Array<{
    courseId: string;
    courseTitle: string;
    totalEnrollments: number;
    completions: number;
    completionRate: number;
  }>;
  completionRateByBranch: Array<{
    branch: string;
    totalUsers: number;
    totalCompletions: number;
    completionRate: number;
  }>;
  usersAtRisk: Array<{
    id: string;
    name: string;
    email: string;
    branch: string | null;
    department: string | null;
  }>;
  progressDistribution: {
    "0-25%": number;
    "25-50%": number;
    "50-75%": number;
    "75-100%": number;
    "100% (Completed)": number;
  };
}

export const LearningAnalytics: React.FC = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<LearningAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/analytics/learning?days=${days}`);
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Error fetching learning analytics:", error);
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
          <div className={styles.loading}>Loading learning analytics...</div>
        </CardBody>
      </Card>
    );
  }

  const progressDistributionData = Object.entries(data.progressDistribution).map(([key, value]) => ({
    name: key,
    value,
  }));

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle className={styles.title}>
          <BookOpen size={20} /> Learning Progress & Completion Analytics
        </CardTitle>
        <DateRangePicker days={days} onChange={setDays} />
      </CardHeader>
      <CardBody>
        <div className={styles.statsGrid}>
          <StatsCard
            label="Overall Completion Rate"
            value={`${data.overallCompletionRate}%`}
            icon={<CheckCircle size={18} />}
          />
          <StatsCard
            label="Average Progress"
            value={`${data.averageProgress}%`}
            icon={<TrendingUp size={18} />}
          />
          <StatsCard
            label="Total Completions"
            value={data.totalCompletions}
            icon={<BookOpen size={18} />}
          />
          <StatsCard
            label="Users at Risk"
            value={data.usersAtRisk.length}
            icon={<AlertTriangle size={18} />}
          />
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Progress Distribution</h3>
            <AnalyticsChart
              type="bar"
              data={progressDistributionData}
              dataKey="value"
              xKey="name"
              yKey="value"
              name="Progress"
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

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Completion Rate by Branch</h3>
            <AnalyticsChart
              type="bar"
              data={data.completionRateByBranch.slice(0, 10).map(branch => ({
                name: branch.branch,
                value: branch.completionRate,
              }))}
              dataKey="value"
              xKey="name"
              yKey="value"
              name="Completion Rate %"
              height={250}
            />
          </div>
        </div>

        {data.usersAtRisk.length > 0 && (
          <div className={styles.atRiskSection}>
            <h3 className={styles.sectionTitle}>Users at Risk</h3>
            <div className={styles.atRiskTable}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Branch</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {data.usersAtRisk.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.branch || "N/A"}</td>
                      <td>{user.department || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

