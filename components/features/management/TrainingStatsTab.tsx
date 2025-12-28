"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Loader2, BookOpen, Users, TrendingUp } from "lucide-react";
import styles from "./TrainingStatsTab.module.css";

export interface CourseStats {
  courseId: string;
  courseTitle: string;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  averageProgress: number;
}

export interface TrainingStatsTabProps {
  managerRole: "BRANCH_MANAGER" | "AREA_MANAGER" | "REGIONAL_MANAGER";
}

export const TrainingStatsTab: React.FC<TrainingStatsTabProps> = ({
  managerRole,
}) => {
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/management/training-stats?role=${managerRole}`
        );
        const data = await response.json();

        if (data.success) {
          setCourseStats(data.data.stats || []);
        } else {
          setError(data.error || "Failed to load training stats");
        }
      } catch (err) {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [managerRole]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={24} className={styles.loader} />
        <p className={styles.loadingText}>Loading training statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={styles.errorCard}>
        <CardBody>
          <p className={styles.errorText}>{error}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className={styles.container}>
      <Card className={styles.statsCard}>
        <CardHeader>
          <h2 className={styles.cardTitle}>Training Statistics</h2>
          <p className={styles.cardSubtitle}>
            Overview of course completion across your team
          </p>
        </CardHeader>
        <CardBody className={styles.compactBody}>
          {courseStats.length === 0 ? (
            <p className={styles.emptyText}>
              No training statistics available yet.
            </p>
          ) : (
            <div className={styles.statsList}>
              {courseStats.map((stat) => {
                const completionRate =
                  stat.totalAssigned > 0
                    ? (stat.completed / stat.totalAssigned) * 100
                    : 0;

                return (
                  <div key={stat.courseId} className={styles.statCard}>
                    <div className={styles.statHeader}>
                      <div className={styles.statTitleRow}>
                        <BookOpen size={16} className={styles.statIcon} />
                        <h3 className={styles.statTitle}>{stat.courseTitle}</h3>
                      </div>
                      <Badge
                        variant={
                          completionRate >= 80
                            ? "success"
                            : completionRate >= 50
                            ? "default"
                            : "outline"
                        }
                      >
                        {completionRate.toFixed(0)}% Complete
                      </Badge>
                    </div>

                    <div className={styles.statProgress}>
                      <ProgressBar
                        value={stat.averageProgress}
                        showPercentage={false}
                      />
                      <span className={styles.progressText}>
                        {stat.averageProgress.toFixed(0)}% average progress
                      </span>
                    </div>

                    <div className={styles.statMetrics}>
                      <div className={styles.statMetric}>
                        <Users size={14} className={styles.metricIcon} />
                        <div>
                          <span className={styles.metricLabel}>Assigned</span>
                          <span className={styles.metricValue}>
                            {stat.totalAssigned}
                          </span>
                        </div>
                      </div>
                      <div className={styles.statMetric}>
                        <TrendingUp size={14} className={styles.metricIcon} />
                        <div>
                          <span className={styles.metricLabel}>Completed</span>
                          <span className={styles.metricValue}>
                            {stat.completed}
                          </span>
                        </div>
                      </div>
                      <div className={styles.statMetric}>
                        <div>
                          <span className={styles.metricLabel}>In Progress</span>
                          <span className={styles.metricValue}>
                            {stat.inProgress}
                          </span>
                        </div>
                      </div>
                      <div className={styles.statMetric}>
                        <div>
                          <span className={styles.metricLabel}>Not Started</span>
                          <span className={styles.metricValue}>
                            {stat.notStarted}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

