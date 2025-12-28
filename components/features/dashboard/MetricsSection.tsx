"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import {
  TrendingUp,
  Award,
  Flame,
  Target,
  BookCheck,
  Clock,
} from "lucide-react";
import styles from "./MetricsSection.module.css";

export interface UserMetrics {
  coursesCompleted: number;
  totalXP: number;
  currentLevel: number;
  progressToNextLevel: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  recentAchievements: Array<{
    id: string;
    name: string;
    type: string;
    earnedAt: string;
  }>;
  totalCoursesStarted: number;
  totalDaysOnPlatform: number;
}

export interface MetricsSectionProps {
  userId?: string;
}

export const MetricsSection: React.FC<MetricsSectionProps> = ({ userId }) => {
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        const url = userId
          ? `/api/dashboard/metrics?userId=${userId}`
          : "/api/dashboard/metrics";
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
          setMetrics(data.data);
        } else {
          setError(data.error || "Failed to load metrics");
        }
      } catch (err) {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [userId]);

  if (isLoading) {
    return (
      <Card className={styles.card}>
        <CardHeader>
          <h2 className={styles.cardTitle}>Your Metrics</h2>
        </CardHeader>
        <CardBody>
          <p className={styles.loadingText}>Loading metrics...</p>
        </CardBody>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card className={styles.card}>
        <CardHeader>
          <h2 className={styles.cardTitle}>Your Metrics</h2>
        </CardHeader>
        <CardBody>
          <p className={styles.errorText}>{error || "Failed to load metrics"}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <CardHeader>
        <h2 className={styles.cardTitle}>Your Metrics</h2>
      </CardHeader>
      <CardBody className={styles.compactBody}>
        <div className={styles.metricsGrid}>
          {/* Learning Progress */}
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <TrendingUp size={20} className={styles.metricIcon} />
              <span className={styles.metricLabel}>Learning Progress</span>
            </div>
            <div className={styles.metricValue}>{metrics.coursesCompleted}</div>
            <span className={styles.metricSubtext}>Courses Completed</span>
            <div className={styles.progressWrapper}>
              <ProgressBar
                value={metrics.progressToNextLevel}
                showPercentage
                label={`Level ${metrics.currentLevel}`}
              />
            </div>
          </div>

          {/* Completion Rate */}
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <Target size={20} className={styles.metricIcon} />
              <span className={styles.metricLabel}>Completion Rate</span>
            </div>
            <div className={styles.metricValue}>
              {metrics.completionRate.toFixed(0)}%
            </div>
            <span className={styles.metricSubtext}>
              {metrics.totalCoursesStarted} courses started
            </span>
          </div>

          {/* Streak Days */}
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <Flame size={20} className={styles.metricIcon} />
              <span className={styles.metricLabel}>Streak</span>
            </div>
            <div className={styles.metricValue}>{metrics.currentStreak}</div>
            <span className={styles.metricSubtext}>
              Longest: {metrics.longestStreak} days
            </span>
          </div>

          {/* Total XP */}
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <Award size={20} className={styles.metricIcon} />
              <span className={styles.metricLabel}>Total XP</span>
            </div>
            <div className={styles.metricValue}>
              {metrics.totalXP.toLocaleString()}
            </div>
            <span className={styles.metricSubtext}>Level {metrics.currentLevel}</span>
          </div>

          {/* Days on Platform */}
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <Clock size={20} className={styles.metricIcon} />
              <span className={styles.metricLabel}>Days Active</span>
            </div>
            <div className={styles.metricValue}>{metrics.totalDaysOnPlatform}</div>
            <span className={styles.metricSubtext}>On platform</span>
          </div>

          {/* Recent Achievements */}
          {metrics.recentAchievements.length > 0 && (
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <BookCheck size={20} className={styles.metricIcon} />
                <span className={styles.metricLabel}>Recent Achievements</span>
              </div>
              <div className={styles.achievementsList}>
                {metrics.recentAchievements.slice(0, 3).map((achievement) => (
                  <Badge key={achievement.id} variant="default" className={styles.achievementBadge}>
                    {achievement.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

