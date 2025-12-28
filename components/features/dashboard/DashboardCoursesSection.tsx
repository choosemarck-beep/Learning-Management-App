"use client";

import React from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./DashboardCoursesSection.module.css";

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string | null;
  totalXP: number;
  progress: number;
  isCompleted: boolean;
}

export interface DashboardCoursesSectionProps {
  courses: Course[];
}

export const DashboardCoursesSection: React.FC<DashboardCoursesSectionProps> = ({
  courses,
}) => {
  const router = useRouter();

  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  if (courses.length === 0) {
    return (
      <Card className={styles.card}>
        <CardHeader>
          <h2 className={styles.cardTitle}>Courses</h2>
        </CardHeader>
        <CardBody className={styles.compactBody}>
          <div className={styles.emptyState}>
            <BookOpen size={48} className={styles.emptyIcon} />
            <p className={styles.emptyText}>
              No courses yet. Start your learning journey!
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <CardHeader>
        <h2 className={styles.cardTitle}>Courses</h2>
      </CardHeader>
      <CardBody className={styles.compactBody}>
        <div className={styles.coursesList}>
          {courses.map((course) => (
            <div key={course.id} className={styles.courseItem}>
              <div className={styles.courseHeader}>
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className={styles.thumbnail}
                  />
                ) : (
                  <div className={styles.thumbnailPlaceholder}>
                    <BookOpen size={20} />
                  </div>
                )}
                <div className={styles.courseInfo}>
                  <h3 className={styles.courseTitle}>{course.title}</h3>
                  <p className={styles.courseDescription}>
                    {course.description}
                  </p>
                </div>
              </div>

              <div className={styles.progressSection}>
                <ProgressBar
                  value={course.progress}
                  showPercentage
                  label={`${course.progress}% Complete`}
                />
              </div>

              <div className={styles.courseFooter}>
                <span className={styles.xpBadge}>
                  {course.totalXP} XP available
                </span>
                <Button
                  variant={course.progress > 0 ? "secondary" : "primary"}
                  size="sm"
                  onClick={() => handleCourseClick(course.id)}
                >
                  {course.isCompleted
                    ? "Review"
                    : course.progress > 0
                    ? "Continue"
                    : "Start"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

