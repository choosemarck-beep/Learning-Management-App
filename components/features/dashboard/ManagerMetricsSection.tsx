"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Users, TrendingUp, Target, Award } from "lucide-react";
import styles from "./ManagerMetricsSection.module.css";

export interface TeamMetrics {
  teamSize: number;
  averageProgress: number;
  completionRate: number;
  topPerformers: Array<{
    id: string;
    name: string;
    xp: number;
    coursesCompleted: number;
  }>;
  totalTeamXP: number;
}

export interface ManagerMetricsSectionProps {
  managerRole: "BRANCH_MANAGER" | "AREA_MANAGER" | "REGIONAL_MANAGER";
}

export const ManagerMetricsSection: React.FC<ManagerMetricsSectionProps> = ({
  managerRole,
}) => {
  const [metrics, setMetrics] = useState<TeamMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchManagerMetrics = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/dashboard/manager-metrics?role=${managerRole}`
        );
        const data = await response.json();

        if (data.success) {
          setMetrics(data.data);
        } else {
          setError(data.error || "Failed to load team metrics");
        }
      } catch (err) {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchManagerMetrics();
  }, [managerRole]);

  if (isLoading) {
    return (
      <Card className={styles.card}>
        <CardHeader>
          <h2 className={styles.cardTitle}>Team Metrics</h2>
        </CardHeader>
        <CardBody>
          <p className={styles.loadingText}>Loading team metrics...</p>
        </CardBody>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card className={styles.card}>
        <CardHeader>
          <h2 className={styles.cardTitle}>Team Metrics</h2>
        </CardHeader>
        <CardBody>
          <p className={styles.errorText}>{error || "Failed to load team metrics"}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <CardHeader>
        <h2 className={styles.cardTitle}>Team Metrics</h2>
      </CardHeader>
      <CardBody className={styles.compactBody}>
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <Users size={20} className={styles.metricIcon} />
            <div className={styles.metricContent}>
              <span className={styles.metricLabel}>Team Size</span>
              <span className={styles.metricValue}>{metrics.teamSize}</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <TrendingUp size={20} className={styles.metricIcon} />
            <div className={styles.metricContent}>
              <span className={styles.metricLabel}>Avg Progress</span>
              <span className={styles.metricValue}>
                {metrics.averageProgress.toFixed(0)}%
              </span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <Target size={20} className={styles.metricIcon} />
            <div className={styles.metricContent}>
              <span className={styles.metricLabel}>Completion Rate</span>
              <span className={styles.metricValue}>
                {metrics.completionRate.toFixed(0)}%
              </span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <Award size={20} className={styles.metricIcon} />
            <div className={styles.metricContent}>
              <span className={styles.metricLabel}>Total Team XP</span>
              <span className={styles.metricValue}>
                {metrics.totalTeamXP.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {metrics.topPerformers.length > 0 && (
          <div className={styles.topPerformers}>
            <h3 className={styles.topPerformersTitle}>Top Performers</h3>
            <div className={styles.performersList}>
              {metrics.topPerformers.slice(0, 5).map((performer, index) => (
                <div key={performer.id} className={styles.performerItem}>
                  <span className={styles.performerRank}>#{index + 1}</span>
                  <span className={styles.performerName}>{performer.name}</span>
                  <span className={styles.performerStats}>
                    {performer.coursesCompleted} courses • {performer.xp.toLocaleString()} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

