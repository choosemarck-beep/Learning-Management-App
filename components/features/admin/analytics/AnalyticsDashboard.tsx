"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Accordion } from "@/components/ui/Accordion";
import { StatsCard } from "../StatsCard";
import { UserAnalytics } from "./UserAnalytics";
import { LearningAnalytics } from "./LearningAnalytics";
import { CourseAnalytics } from "./CourseAnalytics";
import { QuizAnalytics } from "./QuizAnalytics";
import { GamificationAnalytics } from "./GamificationAnalytics";
import { EngagementAnalytics } from "./EngagementAnalytics";
import { Users, BookOpen, CheckCircle, Trophy, FileQuestion, Activity } from "lucide-react";
import styles from "./AnalyticsDashboard.module.css";

interface OverviewData {
  totalUsers: number;
  newUsers: number;
  activeLearners: number;
  totalCourses: number;
  publishedCourses: number;
  totalTrainings: number;
  publishedTrainings: number;
  totalCompletions: number;
  completionRate: number;
  totalXP: number;
  averageXP: number;
  totalBadges: number;
  pendingApprovals: number;
}

export const AnalyticsDashboard: React.FC = () => {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/analytics/overview?days=30");
        const result = await response.json();
        if (result.success) {
          setOverviewData(result.data);
        }
      } catch (error) {
        console.error("Error fetching overview analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  if (loading || !overviewData) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading analytics dashboard...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Overview Stats */}
      <div className={styles.overviewSection}>
        <h2 className={styles.sectionTitle}>Overview</h2>
        <div className={styles.overviewGrid}>
          <StatsCard
            label="Total Users"
            value={overviewData.totalUsers}
            icon={<Users size={18} />}
          />
          <StatsCard
            label="Active Learners"
            value={overviewData.activeLearners}
            icon={<CheckCircle size={18} />}
          />
          <StatsCard
            label="Total Courses"
            value={overviewData.totalCourses}
            icon={<BookOpen size={18} />}
          />
          <StatsCard
            label="Completion Rate"
            value={`${overviewData.completionRate}%`}
            icon={<Trophy size={18} />}
          />
        </div>
      </div>

      {/* Analytics Widgets - Accordion Format */}
      <div className={styles.analyticsSection}>
        <Accordion
          title="User & Employee Analytics"
          icon={<Users size={18} />}
          defaultOpen={false}
        >
          <UserAnalytics />
        </Accordion>
        
        <Accordion
          title="Learning Progress & Completion Analytics"
          icon={<BookOpen size={18} />}
          defaultOpen={false}
        >
          <LearningAnalytics />
        </Accordion>
        
        <Accordion
          title="Course & Training Analytics"
          icon={<BookOpen size={18} />}
          defaultOpen={false}
        >
          <CourseAnalytics />
        </Accordion>
        
        <Accordion
          title="Quiz Performance Analytics"
          icon={<FileQuestion size={18} />}
          defaultOpen={false}
        >
          <QuizAnalytics />
        </Accordion>
        
        <Accordion
          title="Gamification Analytics"
          icon={<Trophy size={18} />}
          defaultOpen={false}
        >
          <GamificationAnalytics />
        </Accordion>
        
        <Accordion
          title="Engagement Analytics"
          icon={<Activity size={18} />}
          defaultOpen={false}
        >
          <EngagementAnalytics />
        </Accordion>
      </div>
    </div>
  );
};

