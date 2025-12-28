"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Calendar,
  BookOpen,
  Award,
  TrendingUp,
  Flame,
  Star,
} from "lucide-react";
import styles from "./EmployeeJourneySection.module.css";

export interface JourneyStats {
  totalDaysOnPlatform: number;
  totalCoursesCompleted: number;
  totalXP: number;
  currentLevel: number;
  currentRank: string;
  badgesEarned: number;
  longestStreak: number;
  firstCourseDate: string | null;
  firstBadgeDate: string | null;
  levelUpCount: number;
}

export interface EmployeeJourneySectionProps {
  userId?: string;
}

export const EmployeeJourneySection: React.FC<
  EmployeeJourneySectionProps
> = ({ userId }) => {
  const [stats, setStats] = useState<JourneyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJourneyStats = async () => {
      try {
        setIsLoading(true);
        const url = userId
          ? `/api/dashboard/journey?userId=${userId}`
          : "/api/dashboard/journey";
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
          setStats(data.data);
        } else {
          setError(data.error || "Failed to load journey stats");
        }
      } catch (err) {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJourneyStats();
  }, [userId]);

  if (isLoading) {
    return (
      <Card className={styles.card}>
        <CardHeader>
          <h2 className={styles.cardTitle}>Your Journey</h2>
        </CardHeader>
        <CardBody>
          <p className={styles.loadingText}>Loading journey stats...</p>
        </CardBody>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className={styles.card}>
        <CardHeader>
          <h2 className={styles.cardTitle}>Your Journey</h2>
        </CardHeader>
        <CardBody>
          <p className={styles.errorText}>{error || "Failed to load journey stats"}</p>
        </CardBody>
      </Card>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className={styles.card}>
      <CardHeader>
        <h2 className={styles.cardTitle}>Your Journey</h2>
      </CardHeader>
      <CardBody className={styles.compactBody}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <Calendar size={18} className={styles.statIcon} />
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Days Active</span>
              <span className={styles.statValue}>{stats.totalDaysOnPlatform}</span>
            </div>
          </div>

          <div className={styles.statItem}>
            <BookOpen size={18} className={styles.statIcon} />
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Courses Completed</span>
              <span className={styles.statValue}>{stats.totalCoursesCompleted}</span>
            </div>
          </div>

          <div className={styles.statItem}>
            <Award size={18} className={styles.statIcon} />
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Total XP</span>
              <span className={styles.statValue}>
                {stats.totalXP.toLocaleString()}
              </span>
            </div>
          </div>

          <div className={styles.statItem}>
            <TrendingUp size={18} className={styles.statIcon} />
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Current Level</span>
              <span className={styles.statValue}>{stats.currentLevel}</span>
            </div>
          </div>

          <div className={styles.statItem}>
            <Star size={18} className={styles.statIcon} />
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Current Rank</span>
              <Badge variant="default">{stats.currentRank}</Badge>
            </div>
          </div>

          <div className={styles.statItem}>
            <Award size={18} className={styles.statIcon} />
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Badges Earned</span>
              <span className={styles.statValue}>{stats.badgesEarned}</span>
            </div>
          </div>

          <div className={styles.statItem}>
            <Flame size={18} className={styles.statIcon} />
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Longest Streak</span>
              <span className={styles.statValue}>{stats.longestStreak} days</span>
            </div>
          </div>

          <div className={styles.statItem}>
            <TrendingUp size={18} className={styles.statIcon} />
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Level Ups</span>
              <span className={styles.statValue}>{stats.levelUpCount}</span>
            </div>
          </div>
        </div>

        {(stats.firstCourseDate || stats.firstBadgeDate) && (
          <div className={styles.milestones}>
            <h3 className={styles.milestonesTitle}>Milestones</h3>
            <div className={styles.milestonesList}>
              {stats.firstCourseDate && (
                <div className={styles.milestoneItem}>
                  <span className={styles.milestoneLabel}>First Course</span>
                  <span className={styles.milestoneDate}>
                    {formatDate(stats.firstCourseDate)}
                  </span>
                </div>
              )}
              {stats.firstBadgeDate && (
                <div className={styles.milestoneItem}>
                  <span className={styles.milestoneLabel}>First Badge</span>
                  <span className={styles.milestoneDate}>
                    {formatDate(stats.firstBadgeDate)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

