"use client";

import React, { useEffect, useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import {
  CheckCircle,
  BookOpen,
  Play,
  Award,
  TrendingUp,
  Loader2,
} from "lucide-react";
import styles from "./ActivityTab.module.css";

export interface Activity {
  id: string;
  type: "TASK_COMPLETED" | "LESSON_COMPLETED" | "COURSE_STARTED" | "ACHIEVEMENT_EARNED" | "LEVEL_UP";
  description: string;
  timestamp: Date;
  courseName?: string;
  lessonName?: string;
  taskName?: string;
  badgeName?: string;
  level?: number;
}

export interface ActivityTabProps {
  userId: string;
}

export const ActivityTab: React.FC<ActivityTabProps> = ({ userId }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/employee/activity");
        const data = await response.json();

        if (data.success && data.data) {
          setActivities(data.data);
        } else {
          setError(data.error || "Failed to load activities");
        }
      } catch (err) {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [userId]);

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "TASK_COMPLETED":
        return <CheckCircle size={20} className={styles.iconTask} />;
      case "LESSON_COMPLETED":
        return <BookOpen size={20} className={styles.iconLesson} />;
      case "COURSE_STARTED":
        return <Play size={20} className={styles.iconCourse} />;
      case "ACHIEVEMENT_EARNED":
        return <Award size={20} className={styles.iconAchievement} />;
      case "LEVEL_UP":
        return <TrendingUp size={20} className={styles.iconLevelUp} />;
      default:
        return <CheckCircle size={20} />;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else {
      return activityDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: activityDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={24} className={styles.loader} />
        <p className={styles.loadingText}>Loading activities...</p>
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

  if (activities.length === 0) {
    return (
      <Card className={styles.emptyCard}>
        <CardBody>
          <p className={styles.emptyText}>
            No activities yet. Start learning to see your progress here!
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className={styles.container}>
      {activities.map((activity) => (
        <Card key={activity.id} className={styles.activityCard}>
          <CardBody>
            <div className={styles.activityItem}>
              <div className={styles.iconContainer}>
                {getActivityIcon(activity.type)}
              </div>
              <div className={styles.activityContent}>
                <p className={styles.activityDescription}>
                  {activity.description}
                </p>
                <span className={styles.activityTimestamp}>
                  {formatTimestamp(activity.timestamp)}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};

